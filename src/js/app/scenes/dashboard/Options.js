import React from "react"
import ReactGA from "react-ga";
import { Row, Col, Button, CustomInput, FormGroup, Input, Label } from "reactstrap";

const Options = ({ user,

                    devMode, 
                    showCounter, 
                    setDevMode, 
                    setShowCounter, 

                    devModeUrl,
                    setDevModeUrl,

                    success,
                    setSuccess,
                    SuccessAnimation,

                    logout,
                    saveSettings }) => {

    return (
        <div className="d-flex flex-column p-4 h-100">
            <h2 className="text-center">
                Settings
            </h2>
            <p className="lead">
                Hey there, <span className="fw-600">{ user.username }</span>.
            </p>
            <p>
                You've captured <span className="text-success fw-600">{ user.profile.totalDatapoints }</span> actions with Metro
            </p>
            <hr></hr>
            <CustomInput 
                checked={ showCounter }
                onChange={ () => {
                    ReactGA.event({
                        category: 'Extension Settings',
                        action: "Set showCounter to " + !showCounter,
                    });
                    setShowCounter(!showCounter) 
                }}
                type="checkbox" 
                id="showCounterCheckbox" 
                label="Show the DataSource counter" 
            />
            <CustomInput 
                checked={ devMode }
                onChange={ () => {
                    ReactGA.event({
                        category: 'Extension Settings',
                        action: "Set DevMode to " + !devMode,
                    });
                    setDevMode(!devMode) 
                }}
                className="mb-3"
                type="checkbox" 
                id="devModeCheckbox" 
                label="Developer Mode" 
            />
            <FormGroup className={ devMode ? '' : 'd-none' }>
                <Input 
                    type="text" 
                    name="devModeUrl" 
                    id="devModeUrl" 
                    placeholder="Dev DataSource URL" 
                    value={devModeUrl}
                    onChange={e => setDevModeUrl(e.target.value)}
                />
            </FormGroup>
            <Row className="mt-auto">
                <Col className="d-flex align-items-center pt-2">
                    <Button 
                        className="mr-2" 
                        onClick={ () => { 
                            ReactGA.event({
                                category: 'Extension Settings',
                                action: "Clicked save button",
                            });
                            saveSettings() 
                        }} 
                        color="primary"
                    >
                        Save
                    </Button>
                    {
                        success ? <SuccessAnimation onComplete={ () => setSuccess(false) } /> : ''
                    }
                </Col>
                <Col xs="2" className="d-flex align-items-center pt-2">
                    <a 
                        style={{cursor: 'pointer'}} 
                        onClick={ () => { 
                            ReactGA.event({
                                category: 'Extension Settings',
                                action: "Clicked logout button",
                            });
                            logout()
                        }} 
                        className="text-danger"
                    >
                        Logout
                    </a>
                </Col>
            </Row>
        </div>
    )
}

export default Options;