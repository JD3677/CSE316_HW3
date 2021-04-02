import React from 'react';

import { WButton, WRow, WCol } from 'wt-frontend';

const TableHeader = (props) => {

    const buttonStyle = props.disabled ? ' table-header-button-disabled ' : 'table-header-button ';
    const clickDisabled = () => {};
    const handleCloseList = () => {
        props.activeAdd();
        props.setActiveList({});
    }

    return (
        <WRow className="table-header">
            <WCol size="3">
                <WButton className='table-header-section' wType="texted" onClick = {props.sortItemByDescription}>Task</WButton>
            </WCol>

            <WCol size="2">
                <WButton className='table-header-section' wType="texted" onClick = {props.sortItemByDue}>Due Date</WButton>
            </WCol>

            <WCol size="2">
                <WButton className='table-header-section' wType="texted" onClick = {props.sortItemByStatus}>Status</WButton>
            </WCol>

            <WCol size="2">
                <WButton className='table-header-section' wType="texted" onClick = {props.sortItemByAssgin}>Assigned to</WButton>
            </WCol>

            <WCol size="3">
                <div className = "button-group">
                    <WButton className="sidebar-buttons undo-redo" onClick={props.undo} wType="texted" shape="rounded">
                            <i className="material-icons" id = "undo">undo</i>
                    </WButton>
                    <WButton className="sidebar-buttons undo-redo" onClick={props.redo} wType="texted" shape="rounded">
                            <i className="material-icons" id = "redo">redo</i>
                    </WButton>
                    
                    <div className="table-header-buttons">
                        <WButton onClick={props.disabled ? clickDisabled : props.addItem} wType="texted" className={`${buttonStyle}`}>
                            <i className="material-icons">add_box</i>
                        </WButton>
                        <WButton onClick={props.disabled ? clickDisabled : props.setShowDelete} wType="texted" className={`${buttonStyle}`}>
                            <i className="material-icons">delete_outline</i>
                        </WButton>
                        <WButton onClick={props.disabled ? clickDisabled : handleCloseList} wType="texted" className={`${buttonStyle}`}>
                            <i className="material-icons">close</i>
                        </WButton>
                    </div>
                </div>
            </WCol>

        </WRow>
    );
};

export default TableHeader;