import React, { useEffect, useState } from "react";
import classnames from 'classnames';
import { Container, Row, Col, Button, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCog, faTimes, faPause } from '@fortawesome/free-solid-svg-icons'
import browser from "webextension-polyfill";
import moment from "moment";
import momentDurationFormatSetup from "moment-duration-format"
import Countdown from 'react-countdown-now';
import ReactGA from "react-ga";

momentDurationFormatSetup(moment)

import "../../../../scss/metro.scss"
import Settings from "../../../utils/settings"
import OptionsContainer from "./OptionsContainer";
import FeedsContainer from "./FeedsContainer";
import ActiveContainer from "./ActiveContainer";
import Loading from "../../common/components/Loading";
import { setIndicator } from "../../services/indicator";

const settings = new Settings();

const Dashboard = ({ metroClient, onLogout }) => {
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [textAlert, setTextAlert] = useState('');

    const [activeTab, setActiveTab] = useState('1');
    const [settingsOpen, setSettingsOpen] = useState(false);

    const [paused, setPaused] = useState(false);
    const [unpauseTime, setUnpauseTime] = useState(null);

    useEffect(() => {
        initializeAlert();
        initializeTab();
        // Check if we are paused
        initializePause();
        return;
    }, []);

    /*
    *   Set up the active tab
    */
    const initializeAlert = async () => {
        try {
            const devMode = await settings.devMode() || false;
            if(devMode == true) {
                setTextAlert("Developer Mode")
            }
        } catch(err) {
            console.error(err)
            return;
        }

    }

    /*
    *   Set up the active tab
    */
   const initializeTab = async () => {
       try {
            const activeTab = await settings.getActiveTab() || '1';
            setActiveTab(activeTab);
       } catch(err) {
            setActiveTab('1');
       }

   }

    /*
    *   Set up the initial pause state
    */
    const initializePause = async () => {
        const settingsPaused = await settings.paused()
        if(settingsPaused == true) {
            setPaused(settingsPaused)
            setUnpauseTime(await settings.unpauseTime())
            setIndicator()
        } else if(settingsPaused == false) {
            setPaused(settingsPaused)
            setUnpauseTime(null)
            setIndicator()
        }
        setIsLoading(false)
    }

    /*
    *   Toggles Metro data-capture functionality
    */
    const pauseMetro = async (seconds) => {
        try {
            await browser.runtime.sendMessage({
                method: 'pause',
                seconds: seconds
            })
        } catch(err) {
            console.error(err)
            setError(true)
            return;
        }
        setUnpauseTime(Date.now() + seconds * 1000)
        setPaused(true);
        setIndicator()
    }

    /*
    *   Sends a message to the background page to un-pause Metro,
    *   and then un-pause Metro in React.js
    */
    const unPause = async () => {
        console.log("Unpausing")
        try {
            await browser.runtime.sendMessage({
                method: 'unPause'
            })
        } catch(err) {
            console.error(err)
            setError(true)
            return;
        }
        setPaused(false)
        setUnpauseTime(null)
        setIndicator()
    }

    /////////////////////////
    /////   RENDERING   /////
    ///////////////////////// 

    if(isLoading) {
        return <Loading />
    }

    const pauseButton = paused ? (
        <Button size="xs" color="danger" className="mr-6" onClick={ () => {
            ReactGA.event({
                category: 'Extension Navbar',
                action: "Clicked un-pause button"
            });
            unPause()
        }} >
            <FontAwesomeIcon 
                icon={ faTimes } 
                className="mr-2"
                style={{cursor: 'pointer'}}
            />
            <Countdown 
                date={unpauseTime}
                onComplete={initializePause}
                renderer={ (props) => {
                    return <span>{props.formatted.minutes}:{props.formatted.seconds}</span>
                }}
            />
        </Button>
    ) : (
        <Button size="xs" color="gray-400" className="mr-6" onClick={ () => {
            ReactGA.event({
                category: 'Extension Navbar',
                action: "Clicked pause button",
            });
            pauseMetro(10*60)
        }} >
            <FontAwesomeIcon 
                icon={ faPause } 
                className="mr-2"
                style={{cursor: 'pointer'}}
            />
            Pause
        </Button>
    )

    let tabContent = (
        <div className="h-100">
            <div className={ paused ? "h-100 d-flex flex-column align-items-center justify-content-center" : ' d-none' }>
                <FontAwesomeIcon 
                    icon={ faPause } 
                    size="5x"
                />
                <h2 className="mt-4">Metro is paused.</h2>
            </div>
            <TabContent activeTab={activeTab} className={"p-4 " + (paused ? ' d-none' : '') }>
                <TabPane className="h-100" tabId="1">
                    <ActiveContainer />
                </TabPane>
                <TabPane className="h-100" tabId="2">
                    <FeedsContainer metroClient={ metroClient } />
                </TabPane>
            </TabContent>
        </div>
    )

    return (
        <Container id="mtr-dashboard" className="h-100" fluid>
            <Row className="border-bottom border-gray-200 py-2 bg-light shadow-4">
                <Col className="d-flex align-items-center">
                    <a 
                        href="https://getmetro.co" 
                        target="_blank"
                        onClick={() => {
                            ReactGA.event({
                                category: 'Extension Dashboard',
                                action: "Clicked Metro logo",
                            });
                        }}
                    >
                        <img className="float-left mr-4" width="20" height="20" src="metroLogo.png"></img>
                    </a>
                </Col>
                <Col>
                    <span className="text-danger">
                        { textAlert }
                    </span>
                </Col>
                <Col className="text-right">
                    { pauseButton }
                    <SettingsButton open={settingsOpen} setSettingsOpen={setSettingsOpen} />
                </Col>
            </Row>
            <div className={ "h-90 " + (settingsOpen ? '' : 'd-none')}>
                <OptionsContainer 
                    setTextAlert={ setTextAlert }
                    onLogout={ onLogout }
                    metroClient={ metroClient } 
                />
            </div>
            <div className={ "h-75 " + (settingsOpen ? 'd-none' : '')}>
                    { tabContent }
                    <Nav tabs justified className="fixed-bottom mtr-tabs">
                        <NavItem>
                            <NavLink 
                                className={classnames({ active: activeTab === '1' })}
                                onClick={() => {
                                    ReactGA.event({
                                        category: 'Extension Tabs',
                                        action: "Changed tab to 'Active'",
                                    });
                                    setActiveTab('1');
                                    settings.setActiveTab('1')
                                } }
                            >
                                Active
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink 
                                className={classnames({ active: activeTab === '2' })}
                                onClick={() => {
                                    ReactGA.event({
                                        category: 'Extension Tabs',
                                        action: "Changed tab to 'Feeds'",
                                    });
                                    setActiveTab('2');
                                    settings.setActiveTab('2')
                                } }
                            >
                                Feeds
                            </NavLink>
                        </NavItem>
                    </Nav>
            </div>
            
        </Container>
    )
}

const SettingsButton = ({ open, setSettingsOpen }) => {
    if(open) {
        return <span className="fw-600">
                    <FontAwesomeIcon 
                        icon={ faTimes }
                        style={{cursor: 'pointer'}}
                        onClick={ () => {
                            ReactGA.event({
                                category: 'Extension Navbar',
                                action: "Closed settings page",
                            });
                            setSettingsOpen(false)
                        }} 
                    />
                </span>
    } else {
        return <FontAwesomeIcon 
                    icon={ faCog }
                    style={{cursor: 'pointer'}}
                    onClick={ () => {
                        ReactGA.event({
                            category: 'Extension Navbar',
                            action: "Opened settings page",
                        });
                        setSettingsOpen(true)
                    }} 
                />
    }
}

export default Dashboard;