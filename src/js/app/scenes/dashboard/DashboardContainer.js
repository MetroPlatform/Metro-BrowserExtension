import React, { useEffect, useState } from "react";

import Dashboard from "./Dashboard";

const DashboardContainer = ({ metroClient, onLogout }) => {


    return (
        <Dashboard 
            onLogout={ onLogout }
            metroClient={ metroClient } 
        />
    )
}
  
  export default DashboardContainer;