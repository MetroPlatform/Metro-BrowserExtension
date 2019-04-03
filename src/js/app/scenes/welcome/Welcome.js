import React from "react";
import { Wizard, Steps, Step } from 'react-albus';
import ReactGA from "react-ga";
import { Button, Col, Container, Row } from "reactstrap";

import LoginContainer from "../welcome/LoginContainer";

/*
    Wizard Steps
*/

const WelcomeIntro = ({ onClick }) => (
    <div>
        <Row className="mb-4">
            <Col className="text-center mb-4">
                <img src="metroLogo.png" width={ 60 } height={ 60 }/>
            </Col>
        </Row>
        <Row>
            <Col>
                <Button 
                    onClick={ () => {
                        ReactGA.event({
                            category: 'Extension Welcome Page',
                            action: "Clicked Log In",
                        });
                        onClick()
                    }}
                    color="success"
                >
                    Log In
                </Button>
                <Button 
                    tag="a" 
                    className="ml-2"
                    target="_blank"
                    href="https://getmetro.co/signup/"
                    color="primary"
                    onClick={() => {
                        ReactGA.event({
                            category: 'Extension Welcome Page',
                            action: "Clicked Sign Up"
                        });
                    }}
                >
                    Sign Up
                </Button>
            </Col>
        </Row>
    </div>
)



/*
*   Welcome screen when the user first opens the extension.
*
*   Prompts the user to login, or else shows the main app
*/
const Welcome = ({ metroClient, onLogin }) => {
    return (
        <Wizard render={() => (
            <Container className="mtr-welcome p-5">
                <Steps>
                    <Step id="step-one" render={({next}) => (
                        <div className="text-center">
                            <WelcomeIntro onClick={next} />
                        </div>
                    )} />
                    <Step id="step-two" render={() => (
                        <LoginContainer onLogin={ onLogin } metroClient={ metroClient } />
                    )} />
                </Steps>
            </Container>
        )} />
    )
}

export default Welcome;