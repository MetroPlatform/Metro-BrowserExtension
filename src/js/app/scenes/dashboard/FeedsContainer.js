import React, { useState, useEffect } from "react";
import ReactGA from "react-ga";
import { Row, Col, Card, ListGroup, ListGroupItem } from "reactstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faHeartBroken, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import moment from "moment";

import Loading from "../../common/components/Loading";

const FeedItem = ({ str, url, index, action, feedName, timestamp, hostname }) => (
    <Row>
        <Col>
            <Card body className="border border-gray-400 shadow-2 hover-shadow-3 small mb-4">
                <a 
                    href={ url } 
                    target="_blank"
                    className="text-decoration-0"
                    onClick={() => {
                        ReactGA.event({
                            category: 'Extension Feed',
                            action: "Opened link #" + index,
                            label: "Feed: " + feedName
                        });
                    }}
                >
                    <Row>
                        <Col xs="9" className="text-dark">
                            { str }
                        </Col>
                    </Row>
                    <Row>
                        <Col className="text-muted">
                            <span className="mr-1 small">( { hostname } )</span>
                        </Col>
                    </Row>
                    <Row>
                        <Col className="text-muted">
                            <span className="mr-1 fw-600">{ action }</span> <span className="mr-1"> {String.fromCharCode(8226)}</span> { moment(timestamp).fromNow() }
                        </Col>
                    </Row>
                </a>
            </Card>
        </Col>
    </Row>
)

const FeedList = ( activeFeed ) => {
    return (
        <div className="mtr-feed-content">
            {
                activeFeed.feed.slice(0, 5).map((val, idx) => {
                    const url = val.data._url;
                    const hostname = new URL(url).hostname.replace(/^(https?:\/\/)?(www\.)?/,'');
                    return <FeedItem 
                                feedName={ activeFeed.name }
                                url={ url } 
                                index={ idx }
                                hostname={ hostname }
                                timestamp={ val.data._timestamp } 
                                str={ val.data._str } 
                                action={ val.data._action }
                            />
                })
            }
        </div>
    )
}

const FeedsContainer = ({ metroClient }) => {
    const [feeds, setFeeds] = useState([]);
    const [feedNames, setFeedNames] = useState([]);
    const [activeFeedIdx, setActiveFeedIdx] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [feedsLoading, setFeedsLoading] = useState(true);
    const [error, setError] = useState(false);

    /*
    *   Load the Feed names first, then load the feeds themselves
    *   in the background. Sp00ky
    */
    const initialize = async () => {
        try {
            const favourites = await metroClient.profile.favourites();
            setFeedNames(favourites);
            setIsLoading(false)
            const feedPromises = await favourites.map(async (feed) => {
                let feedContent = await metroClient.feeds.feedContent(feed.slug)
                return feedContent
            })

            // obj.map(async () => {}) returns a list of promises, so we must resolve them
            const allFeeds = await Promise.all(feedPromises)
            setFeeds(allFeeds)
            setFeedsLoading(false)
        } catch(err) {
            console.error(err)
        }
    }

    useEffect(() => {
        initialize()
        return;
    }, [])

    if(isLoading) {
        return <Loading />
    } else if(error) {
        return "Error! :("
    }

    let content;
    let title;
    if(activeFeedIdx == null) {
        title = "Favourite Feeds";
        if(feedNames.length < 1) {
            content = (
                <div className="d-flex flex-column justify-content-center align-items-center h-100">
                            <FontAwesomeIcon 
                                icon={faHeartBroken}  
                                color="#efc04e"
                                size="5x"
                            />
                            <h5 className="text-center mt-4">No Favourite Feeds :(</h5>
                </div>
            )
        } else {
            content = (
                <ListGroup className="px-8">
                    {
                        feedNames.map((val, idx) => {
                            return <ListGroupItem 
                                        key={ idx }
                                        className="text-center"
                                        tag="button" 
                                        action 
                                        onClick={ () => setActiveFeedIdx(idx)}
                            >
                                { val.name }
                            </ListGroupItem>
                        })
                    }
                </ListGroup>
            )
        }
    } else {
        if(feedsLoading == true) {
            return <Loading />
        }
        const activeFeed = feeds[activeFeedIdx]
        activeFeed.url = feedNames[activeFeedIdx].url
        activeFeed.name = feedNames[activeFeedIdx].name
        title = (
            <span> 
                { activeFeed.name } 
                <a href={ activeFeed.url } target="_blank">
                    <FontAwesomeIcon
                        className="ml-3"
                        onClick={() => {
                            ReactGA.event({
                                category: 'Extension Feed',
                                action: "Opened Feed detail",
                                label: "Feed: " + activeFeed.name
                            });
                        }}
                        icon={ faExternalLinkAlt }
                    />
                </a>
            </span>
        )
        content = FeedList(activeFeed)
    }

    return (
        <div className="h-100">
            <Row className="border-bottom mb-4">
                { 
                    activeFeedIdx != null ? (
                        <Col xs={1}>
                            <FontAwesomeIcon 
                                icon={faArrowLeft} 
                                style={{cursor: 'pointer'}}
                                onClick={ () => {
                                    ReactGA.event({
                                        category: 'Extension Feed',
                                        action: "Closed Feed",
                                    });
                                    setActiveFeedIdx(null)
                                }}
                            />
                        </Col>
                    ) : (
                        ""
                    )
                }
                
                <Col>
                    <h4 className="text-center">{ title }</h4>
                </Col>
            </Row>
            <Row className="h-75">
                <Col>
                    { content }
                </Col>
            </Row>
        </div>
    )
}

export default FeedsContainer;