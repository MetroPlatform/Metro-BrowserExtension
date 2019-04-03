import React, { useState } from "react";
import Lottie from 'react-lottie';
import * as successAnimationData from '../../../../animations/successTick.json'

const SuccessAnimation = ({onComplete}) => {
    const [isStopped, setIsStopped] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    const tickOptions = {
        element: 'div',
        loop: false,
        autoplay: true, 
        animationData: successAnimationData.default,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
            className: "mr-0 ml-0"
        }
    }

    return (
        <Lottie 
            style={{margin: "0px 0px"}}
            options={tickOptions}
            height={40}
            width={40}
            eventListeners={[
                {
                    eventName: 'complete',
                    callback: () => {
                        onComplete()
                    }
                },
            ]}
            isStopped={ isStopped }
            isPaused={ isPaused }
        />
    )
}

export default SuccessAnimation;