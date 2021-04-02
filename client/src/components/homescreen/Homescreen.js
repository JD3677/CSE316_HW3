import React, { useState, useEffect } 	from 'react';
import Logo 							from '../navbar/Logo';
import NavbarOptions 					from '../navbar/NavbarOptions';
import MainContents 					from '../main/MainContents';
import SidebarContents 					from '../sidebar/SidebarContents';
import Login 							from '../modals/Login';
import Delete 							from '../modals/Delete';
import CreateAccount 					from '../modals/CreateAccount';
import { GET_DB_TODOS } 				from '../../cache/queries';
import * as mutations 					from '../../cache/mutations';
import { useMutation, useQuery } 		from '@apollo/client';
import { WNavbar, WSidebar, WNavItem } 	from 'wt-frontend';
import { WLayout, WLHeader, WLMain, WLSide } from 'wt-frontend';
import { UpdateListField_Transaction, 
	UpdateListItems_Transaction, 
	ReorderItems_Transaction, 
	EditItem_Transaction, 
	SortItems_Transaction} 				from '../../utils/jsTPS';
import WInput from 'wt-frontend/build/components/winput/WInput';


const Homescreen = (props) => {

	let todolists 							= [];
	const [activeList, setActiveList] 		= useState({});
	const [showDelete, toggleShowDelete] 	= useState(false);
	const [showLogin, toggleShowLogin] 		= useState(false);
	const [showCreate, toggleShowCreate] 	= useState(false);

	const [ReorderTodoItems] 		= useMutation(mutations.REORDER_ITEMS);
	const [UpdateTodoItemField] 	= useMutation(mutations.UPDATE_ITEM_FIELD);
	const [UpdateTodolistField] 	= useMutation(mutations.UPDATE_TODOLIST_FIELD);
	const [DeleteTodolist] 			= useMutation(mutations.DELETE_TODOLIST);
	const [DeleteTodoItem] 			= useMutation(mutations.DELETE_ITEM);
	const [AddTodolist] 			= useMutation(mutations.ADD_TODOLIST);
	const [AddTodoItem] 			= useMutation(mutations.ADD_ITEM);
	const [SortItems]				= useMutation(mutations.SORT_ITEMS);
	const [SortTodos]				= useMutation(mutations.SORT_TODOS);


	const { loading, error, data, refetch } = useQuery(GET_DB_TODOS);
	if(loading) { console.log(loading, 'loading'); }
	if(error) { console.log(error, 'error'); }
	if(data) { todolists = data.getAllTodos; }

	const auth = props.user === null ? false : true;

	const refetchTodos = async (refetch) => {
		const { loading, error, data } = await refetch();
		if (data) {
			todolists = data.getAllTodos;
			if (activeList._id) {
				let tempID = activeList._id;
				let list = todolists.find(list => list._id === tempID);
				setActiveList(list);

			}
		}
	}

	const tpsUndo = async () => {
		const retVal = await props.tps.undoTransaction();
		refetchTodos(refetch);
		return retVal;
	}

	const tpsRedo = async () => {
		const retVal = await props.tps.doTransaction();
		refetchTodos(refetch);
		return retVal;
	}


	// Creates a default item and passes it to the backend resolver.
	// The return id is assigned to the item, and the item is appended
	//  to the local cache copy of the active todolist. 
	const addItem = async () => {
		let list = activeList;
		const items = list.items;
		const lastID = items.length >= 1 ? items[items.length - 1].id + 1 : 0;
		const newItem = {
			_id: '',
			id: lastID,
			description: 'No Description',
			due_date: 'No Date',
			assigned_to: "",
			completed: false
		};
		let opcode = 1;
		let itemID = newItem._id;
		let listID = activeList._id;
		let transaction = new UpdateListItems_Transaction(listID, itemID, newItem, opcode, AddTodoItem, DeleteTodoItem);
		props.tps.addTransaction(transaction);
		tpsRedo();
	};


	const deleteItem = async (item) => {
		let listID = activeList._id;
		let itemID = item._id;
		let opcode = 0;
		let itemToDelete = {
			_id: item._id,
			id: item.id,
			description: item.description,
			due_date: item.due_date,
			assigned_to: item.assigned_to,
			completed: item.completed
		}
		let transaction = new UpdateListItems_Transaction(listID, itemID, itemToDelete, opcode, AddTodoItem, DeleteTodoItem);
		props.tps.addTransaction(transaction);
		tpsRedo();
	};

	const editItem = async (itemID, field, value, prev) => {
		let flag = 0;
		if (field === 'completed') flag = 1;
		let listID = activeList._id;
		let transaction = new EditItem_Transaction(listID, itemID, field, prev, value, flag, UpdateTodoItemField);
		props.tps.addTransaction(transaction);
		tpsRedo();

	};

	const reorderItem = async (itemID, dir) => {
		let listID = activeList._id;
		let transaction = new ReorderItems_Transaction(listID, itemID, dir, ReorderTodoItems);
		props.tps.addTransaction(transaction);
		tpsRedo();

	};

	const createNewList = async () => {
		props.tps.clearAllTransactions();
		const length = todolists.length
		const id = length >= 1 ? todolists[length - 1].id + Math.floor((Math.random() * 100) + 1) : 1;
		let list = {
			_id: '',
			id: id,
			name: 'Untitled',
			owner: props.user._id,
			items: [],
		}
		const { data } = await AddTodolist({ variables: { todolist: list }, refetchQueries: [{ query: GET_DB_TODOS }] });
		setTimeout(function(){ refetchTodos(refetch); }, 300);
		setTimeout(function(){ setActiveList({}); }, 400);
	};

	const deleteList = async (_id) => {
		props.tps.clearAllTransactions();
		DeleteTodolist({ variables: { _id: _id }, refetchQueries: [{ query: GET_DB_TODOS }] });
		refetch();
		setActiveList({});
	};

	const updateListField = async (_id, field, value, prev) => {
		let transaction = new UpdateListField_Transaction(_id, field, prev, value, UpdateTodolistField);
		props.tps.addTransaction(transaction);
		tpsRedo();

	};

	const toList = (update) => {
		let updateList = [];
		for(let i = 0; i< update.length; i++){
			let up = {
				_id: update[i]._id,
				id: update[i].id,
				description: update[i].description,
				due_date: update[i].due_date,
				assigned_to: update[i].assigned_to,
				completed: update[i].completed
			};
			updateList.push(up);
		}
		return updateList;
	}

	const sortItemByDescription = async () => {
		if(activeList._id === undefined)return;
		let prev = [...activeList.items];
		let update = [...activeList.items];
		let compare = [...activeList.items];
		compare.sort(function(a,b){
			var A = a.description.toUpperCase();
			var B = b.description.toUpperCase();
			if (A < B) {return -1;}
			if (A > B) {return 1;}
			  return 0;
			  });

		if(compareLists(update, compare)){
			update.sort(function(a,b){
				var A = a.description.toUpperCase();
				var B = b.description.toUpperCase();
				if (A < B) {return 1;}
				if (A > B) {return -1;}
				  return 0;
				  });
		}else{
			update = compare;
		}

		let transaction = new SortItems_Transaction(activeList._id, toList(prev), toList(update), SortItems);
		props.tps.addTransaction(transaction);
		tpsRedo();
	};

	const sortItemByDue = async () => {
		if(activeList._id === undefined)return;
		let prev = [...activeList.items];
		let update = [...activeList.items];
		let compare = [...activeList.items];
		compare.sort(function(a,b){
			var A = a.due_date.toUpperCase();
			var B = b.due_date.toUpperCase();
			if (A < B) {return -1;}
			if (A > B) {return 1;}
			  return 0;
			  });

		if(compareLists(update, compare)){
			update.sort(function(a,b){
				var A = a.due_date.toUpperCase();
				var B = b.due_date.toUpperCase();
				if (A < B) {return 1;}
				if (A > B) {return -1;}
				  return 0;
				  });
			}else{
				update = compare;
			}
		
			let transaction = new SortItems_Transaction(activeList._id, toList(prev), toList(update), SortItems);
			props.tps.addTransaction(transaction);
			tpsRedo();
	};

	const sortItemByAssgin = async () => {
		if(activeList._id === undefined)return;
		let prev = [...activeList.items];
		let update = [...activeList.items];
		let compare = [...activeList.items];
		compare.sort(function(a,b){
			var A = a.assigned_to.toUpperCase();
			var B = b.assigned_to.toUpperCase();
			if (A < B) {return -1;}
			if (A > B) {return 1;}
			  return 0;
			  });

		if(compareLists(update, compare)){
			update.sort(function(a,b){
				var A = a.assigned_to.toUpperCase();
				var B = b.assigned_to.toUpperCase();
				if (A < B) {return 1;}
				if (A > B) {return -1;}
					return 0;
					});
			}else{
				update = compare;
			}

			let transaction = new SortItems_Transaction(activeList._id, toList(prev), toList(update), SortItems);
			props.tps.addTransaction(transaction);
			tpsRedo();
	};

	const sortItemByStatus = async() => {
		if(activeList._id === undefined)return;
		let prev = [...activeList.items];
		let update = [...activeList.items];
		let compare = [...activeList.items];
		compare.sort(function(a,b){
			var A = a.completed;
			var B = b.completed;
			if (A < B) {return -1;}
			if (A > B) {return 1;}
			  return 0;
			  });

		if(compareLists(update, compare)){
			update.sort(function(a,b){
				var A = a.completed;
				var B = b.completed;
				if (A < B) {return 1;}
				if (A > B) {return -1;}
					return 0;
				});
			}else{
				update = compare;
			}
		
		let transaction = new SortItems_Transaction(activeList._id, toList(prev), toList(update), SortItems);
		props.tps.addTransaction(transaction);
		tpsRedo();
		
	};

	const compareLists = (a, b) => {
		for(let i = 0; i < a.length; i++){
			if(a[i]._id != b[i]._id){return false}
		}
		return true;
	};

	const handleSetActive = (id) => {
		props.tps.clearAllTransactions();
		let temp = [...todolists];
		let targetPos = 0;
		let target;
		for(let i = 0; i < temp.length; i++){
			if(temp[i].id === id){
				target = temp[i];
				targetPos = i;
				break;
			}
		}

		temp.splice(targetPos,1);
		temp.unshift(target);
		
		let final = [];
		for(let i = 0; i< temp.length; i++){
			let up = {
				_id: temp[i]._id,
				id: temp[i].id,
				name: temp[i].name,
				owner: temp[i].owner,
				items: toList(temp[i].items)
			};
			final.push(up);
		}

		SortTodos({ variables: { todolists: final }});

		const todo = todolists.find(todo => todo.id === id || todo._id === id);
		setActiveList(todo);
	};

	
	/*
		Since we only have 3 modals, this sort of hardcoding isnt an issue, if there
		were more it would probably make sense to make a general modal component, and
		a modal manager that handles which to show.
	*/
	const setShowLogin = () => {
		toggleShowDelete(false);
		toggleShowCreate(false);
		toggleShowLogin(!showLogin);
	};

	const setShowCreate = () => {
		toggleShowDelete(false);
		toggleShowLogin(false);
		toggleShowCreate(!showCreate);
	};

	const setShowDelete = () => {
		toggleShowCreate(false);
		toggleShowLogin(false);
		toggleShowDelete(!showDelete)
	}

	return (
		<WLayout wLayout="header-lside">
			<WLHeader>
				<WNavbar color="colored">
					<ul>
						<WNavItem>
							<Logo className='logo' />
						</WNavItem>
					</ul>
					<ul>
						<NavbarOptions
							fetchUser={props.fetchUser} auth={auth} 
							setShowCreate={setShowCreate} setShowLogin={setShowLogin}
							refetchTodos={refetch} setActiveList={setActiveList}
						/>
					</ul>
				</WNavbar>
			</WLHeader>

			<WLSide side="left">
				<WSidebar>
					{
						activeList ?
							<SidebarContents
								todolists={todolists} activeid={activeList.id} auth={auth}
								handleSetActive={handleSetActive} createNewList={createNewList}
								updateListField={updateListField}
							/>
							:
							<></>
					}
				</WSidebar>
			</WLSide>
			<WLMain>
				{
					activeList ? 
							<div className="container-secondary">
								<MainContents
									addItem={addItem} deleteItem={deleteItem}
									editItem={editItem} reorderItem={reorderItem}
									setShowDelete={setShowDelete}
									activeList={activeList} setActiveList={setActiveList}
									sortItemByDescription={sortItemByDescription}
									sortItemByDue = {sortItemByDue}
									sortItemByAssgin = {sortItemByAssgin}
									sortItemByStatus = {sortItemByStatus}
									undo={tpsUndo} redo={tpsRedo}

								/>
							</div>
						:
							<div className="container-secondary" />
				}

			</WLMain>

			{
				showDelete && (<Delete deleteList={deleteList} activeid={activeList._id} setShowDelete={setShowDelete} />)
			}

			{
				showCreate && (<CreateAccount fetchUser={props.fetchUser} setShowCreate={setShowCreate} />)
			}

			{
				showLogin && (<Login fetchUser={props.fetchUser} refetchTodos={refetch}setShowLogin={setShowLogin} />)
			}

		</WLayout>
	);
};

export default Homescreen;