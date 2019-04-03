import ReactGA from 'react-ga';

export default function initializeReactGA() {
    ReactGA.initialize('UA-128326854-1');
    ReactGA.ga('set', 'checkProtocolTask', null);
    console.log("Initialized GA");
}