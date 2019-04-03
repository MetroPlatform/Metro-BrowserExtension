import React, { useState, useEffect } from "react";
import ReactGA from "react-ga";
import browser from "webextension-polyfill";
import { Row, Col, Card, CardTitle, CardText } from "reactstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle } from '@fortawesome/free-solid-svg-icons';

import Loading from "../../common/components/Loading";
import "../../../../img/emptyFavicon.png"

const DataSource = ({ title, url }) => (
    <Row>
        <Col>
                <Card body className="border border-gray-400 shadow-1 hover-shadow-2 small mb-2">
                    <Row>
                        <Col className="border-right">
                            <CardTitle className="mb-1">
                                <h6>{ title }</h6>
                            </CardTitle>
                            <CardText>
                                <Row className="align-items-end">
                                    <Col className="mr-auto small">
                                        <span className="mr-1">Running</span> 
                                        <span className="mr-1"> {String.fromCharCode(8226)}</span>
                                        <a 
                                            href={url} 
                                            target="_blank"
                                            onClick={() => {
                                                ReactGA.event({
                                                    category: 'Extension Navbar',
                                                    action: "Opened DataSource detail",
                                                    label: "Page: Active"
                                                });
                                            }}
                                        >
                                            More Info
                                        </a>
                                    </Col>
                                </Row>
                            </CardText>
                        </Col>
                        <Col xs="2" className="d-flex flex-column align-items-center justify-content-center">
                            <FontAwesomeIcon 
                                className="shadow-2"
                                icon={ faCircle }  
                                color="#10ff00"
                            />
                            <span>Active</span>
                        </Col>
                    </Row>
                    
                </Card>
        </Col>
    </Row>
)

const DataSourceList = ({datasources}) => {
    return (
        datasources.map((val, idx) => (
            <DataSource title={ val.title } url={val.url } />
        ))
    )
}

const ActiveContainer = () => {
    const [datasources, setDatasources] = useState(null);
    const [hostname, setHostname] = useState(null);
    const [hostIcon, setHostIcon] = useState("emptyFavicon.png");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        getDatasources()
        initializeHostname()
        initializeHostImage()
        return;
    }, [])

    /*
    *   Gets the `example.com` hostname of the currently active tab
    */
    const initializeHostname = async () => {
        const tab = await browser.tabs.query({active: true, currentWindow: true})
        const hostname = new URL(tab[0].url).hostname
        const cleanedHost = hostname.indexOf('www.') && hostname || hostname.replace('www.', '');
        setHostname(cleanedHost)
        setIsLoading(false)
    }

    /*
    *   Checks for an "icon" in the DOM and sets it as the host image
    */
    const initializeHostImage = async () => {
        const tabs = await browser.tabs.query({active: true, currentWindow: true})
        try {
            const faviconUrl = await browser.tabs.sendMessage(tabs[0].id, {
                sender: 'popup',
                method: 'getFavicon'
            })
            setHostIcon(faviconUrl)
        } catch(e) {
            // Error is thrown after login, because the Content Script isn't injected
            return;
        }

   }


    /*
    *   Gets a list of the currently running DataSources on the page
    */
    const getDatasources = async () => {
        try {
            const tabs = await browser.tabs.query({active: true, currentWindow: true})
            const activeDatasources = await browser.tabs.sendMessage(tabs[0].id, {method: 'getActiveDataSources'})
            const datasourcesArray = Object.keys(activeDatasources).map(function(key) {
                return activeDatasources[key].details;
            });
            setDatasources(datasourcesArray)
        } catch(err) {
            // Thrown on login, because Content Script isn't injected
            return;
        }
    }

    if(isLoading) {
        return <Loading />
    }

    let content; 
    if(datasources == null || datasources.length == 0) {
        content = (
            <Row className="h-100 mt-6">
                <Col className="d-flex flex-column h-100 justify-content-center align-items-center">
                    <h2>Zzz...</h2>
                    <span>There are no DataSources active on this page.</span>
                </Col>
            </Row>
        )
    } else {
        content = (
                <DataSourceList datasources={ datasources } />
        )
    }

    return (
        <div className="h-100">
            <Row className="align-items-center mt-2">
                <Col>
                    <img 
                        width={40} 
                        height={40} 
                        src={ hostIcon } 
                        alt={ hostname } 
                        className="img-thumbnail p-2 mx-auto d-block shadow-5"
                    ></img>
                </Col>
            </Row>
            <Row className="pt-4">
                <Col>
                    <h5 className="text-center">{ hostname }</h5>
                </Col>
            </Row>
            <hr className="my-2"></hr>
            <div id="datasource-list" className="h-100 px-6 mt-5">
                { content }
            </div>
        </div>
    )
}

export default ActiveContainer;