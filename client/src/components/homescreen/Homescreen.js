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
	const [activeAdd, setActiveAdd]			= useState(true);

	const [ReorderTodoItems] 		= useMutation(mutations.REORDER_ITEMS);
	const [UpdateTodoItemField] 	= useMutation(mutations.UPDATE_ITEM_FIELD);
	const [UpdateTodolistField] 	= useMutation(mutations.UPDATE_TODOLIST_FIELD);
	const [DeleteTodolist] 			= useMutation(mutations.DELETE_TODOLIST);
	const [DeleteTodoItem] 			= useMutation(mutations.DELETE_ITEM);
	const [AddTodolist] 			= useMutation(mutations.ADD_TODOLIST);
	const [AddTodoItem] 			= useMutation(mutations.ADD_ITEM);
	const [SortItems]				= useMutation(mutations.SORT_ITEMS);


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

		if(props.tps.hasTransactionToUndo()){
			document.getElementById("undo").style.color = "white";
		}else{
			document.getElementById("undo").style.color = "#322d2d";
		}

		if(props.tps.hasTransactionToRedo()){
			document.getElementById("redo").style.color = "white";
		}else{
			document.getElementById("redo").style.color = "#322d2d";
		}
		handleArrow();
		return retVal;
	}

	const tpsRedo = async () => {
		const retVal = await props.tps.doTransaction();
		refetchTodos(refetch);

		if(props.tps.hasTransactionToUndo()){
			document.getElementById("undo").style.color = "white";
		}else{
			document.getElementById("undo").style.color = "#322d2d";
		}

		if(props.tps.hasTransactionToRedo()){
			document.getElementById("redo").style.color = "white";
		}else{
			document.getElementById("redo").style.color = "#322d2d";
		}
		handleArrow();
		return retVal;
	}

	const handleArrow = () => {
		try{
			let a = setTimeout(
				function(){
					for(let i = 0; i < document.getElementsByClassName("table-entry-buttons").length; i++){
						document.getElementsByClassName("table-entry-buttons")[i].style.color = "white";
					}
				},150
			);
	
			let b = setTimeout(function(){ document.getElementsByClassName("table-entry-buttons")[0].style.color = "#353a44"; }, 200);
			let c = setTimeout(function(){ document.getElementsByClassName("table-entry-buttons")[document.getElementsByClassName("table-entry-buttons").length - 2].style.color = "#353a44"; }, 200);
			setTimeout(function(){if(document.getElementsByClassName("table-entry-buttons").length == 0){
				clearTimeout(a);
				clearTimeout(b);
				clearTimeout(c);
			}},100)
		}catch(Exception){}
		
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


	const deleteItem = async (item, index) => {
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
		let transaction = new UpdateListItems_Transaction(listID, itemID, itemToDelete, opcode, AddTodoItem, DeleteTodoItem, index);
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
		if(dir == -1 && itemID == activeList.items[0]._id) return;
		if(dir == 1 && itemID == activeList.items[activeList.items.length - 1]._id) return;
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
		await refetchTodos(refetch);
  		if(data) {
			handleSetActive(list.id);
  		}
	};

	const deleteList = async (_id) => {
		props.tps.clearAllTransactions();
		DeleteTodolist({ variables: { _id: _id }, refetchQueries: [{ query: GET_DB_TODOS }] });
		refetch();
		setActiveList({});
		handleAcitveAddList();
	};

	const updateListField = async (_id, field, value, prev) => {
		let transaction = new UpdateListField_Transaction(_id, field, prev, value, UpdateTodolistField);
		props.tps.addTransaction(transaction);
		tpsRedo();
		handleArrow();
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
		handleDeactiveAddList();
		props.tps.clearAllTransactions();

		for(let i = 0; i < document.getElementsByClassName("list-item").length; i++){
			document.getElementsByClassName("list-item")[i].style.color = "white";
		}

		let temp = [...todolists];
		let targetPos = 0;for(let i = 0; i < temp.length; i++){
			if(temp[i].id === id){
				targetPos = i;
				break;
			}
		}
		document.getElementsByClassName("list-item")[targetPos].style.color = "#ffc800";
		
		const todo = todolists.find(todo => todo.id === id || todo._id === id);
		setActiveList(todo);
		handleArrow();
	};

	const handleAcitveAddList = () => {
		setActiveAdd(true);
		document.getElementById("addListButton").style.backgroundColor = "#ffc800";
	}

	const handleDeactiveAddList = () => {
		setActiveAdd(false);
		document.getElementById("addListButton").style.backgroundColor = "#353a44";
	}

	
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
								updateListField={updateListField} activeAdd = {activeAdd}
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
									activeAdd = {handleAcitveAddList}

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