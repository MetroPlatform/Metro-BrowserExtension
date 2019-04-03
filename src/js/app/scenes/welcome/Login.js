import React from "react";

import { Container, Row, Col, Button, FormGroup, Input , FormFeedback } from 'reactstrap';

const ErrorText = ({ text }) => {
    console.log(text)
    return <FormFeedback>
        { text }
    </FormFeedback>
}

const Login = ({ username, setUsername, password, setPassword, onClick, formError }) => {
    return (
        <Container 
            className="p-4 mtr-extension-login" 
            onKeyPress={(event) => {
                if(event.key == "Enter") {
                    event.preventDefault();
                    event.stopPropagation();
                    onClick()
                }
            }}
        >
            <Row className="mb-4">
                <Col className="text-center">
                    <img src="metroLogo.png" width={ 60 } height={ 60 }/>
                </Col>
            </Row>
            <Row>
                <Col>
                    <FormGroup>
                        <Input 
                            type="username" 
                            name="username" 
                            autoFocus
                            autoComplete="off"
                            id="loginUsername" 
                            className="border border-primary shadow-3"
                            onChange={e => setUsername(e.target.value)} 
                            value={ username }
                            placeholder="Username" 
                            invalid={ formError != null }
                        />
                        {
                            formError == null ? '' : <ErrorText text={ formError } />
                        }
                    </FormGroup>
                </Col>
            </Row>

            <Row>
                <Col>
                    <FormGroup>
                        <Input type="password" 
                                name="password" 
                                className="border border-primary shadow-3"
                                id="loginPassword" 
                                onChange={e => setPassword(e.target.value)} 
                                value={ password }
                                placeholder="Password" />
                    </FormGroup>
                </Col>
            </Row>
            <Row>
                <Col className="text-center">
                    <Button onClick={ onClick } color="primary" className="text-center">Log In</Button>
                </Col>
            </Row>
        </Container>
    )
}

export default Login;