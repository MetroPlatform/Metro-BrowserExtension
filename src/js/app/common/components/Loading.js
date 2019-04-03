import React from "react";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faSpinner } from '@fortawesome/free-solid-svg-icons'

const Loading = () => {
    return (
        <div className="h-100 d-flex align-items-center justify-content-center">
            <FontAwesomeIcon 
                icon={ faSpinner }
                size="7x"
                spin
            />
        </div>
    )
}

export default Loading;