import React, { useState } from 'react';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';

const AggregationDropdown = ({ aggregations, activeAggregation }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dropdown size='sm' isOpen={ isOpen } toggle={ () => setIsOpen(!isOpen) }>
            <DropdownToggle className="rounded-0" color='primary' caret>
                { activeAggregation.name }
            </DropdownToggle>
            <DropdownMenu>
                {
                    aggregations.map((agg, idx) => {
                        <DropdownItem onClick={ () => this.props.onClick(idx) }>
                            { agg.name }
                        </DropdownItem>
                    })
                }
            </DropdownMenu>
        </Dropdown>
    )
}

export default AggregationDropdown;