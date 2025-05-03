import { ButtonHTMLAttributes } from 'react'

type PrimaryButtonColor = 'green' | 'blue' | 'red' | 'purple'

const PrimaryButton = ({
    children,
    className,
    shineClassName,
    color,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode, shineClassName?: string, color: PrimaryButtonColor }) => {
    let containerGradientClassName: string | undefined;
    let buttonGradientClassName: string | undefined;
    let shineGradientClassName: string | undefined;
    switch (color) {
        case 'green':
            containerGradientClassName = 'bg-[linear-gradient(to_bottom,_#C7FFE4_0%,_#009D51_20%,_#00A253_92%)]'
            buttonGradientClassName = 'bg-[linear-gradient(to_bottom,_#60FFB1_0%,_#1EE584_21%,_#2BDD86_50%,_#00D96F_92%)]'
            shineGradientClassName = 'bg-[linear-gradient(to_bottom,_rgba(255,255,255,0.75)_0%,_rgba(255,255,255,0.18)_100%)]'
            break;
        case 'blue':
            containerGradientClassName = 'bg-[linear-gradient(to_bottom,_#AEB2FF_0%,_#4257AC_20%,_#192073_92%)]'
            buttonGradientClassName = 'bg-[linear-gradient(to_bottom,_#6060FF_0%,_#3C4DEA_21%,_#3E4DD4_50%,_#2B34DD_100%)]'
            shineGradientClassName = 'bg-[linear-gradient(to_bottom,_rgba(255,255,255,0.31)_0%,_rgba(255,255,255,0.18)_100%)]'
            break;
        case 'red':
            containerGradientClassName = 'bg-[linear-gradient(to_bottom,_#AEB2FF_0%,_#4257AC_20%,_#192073_92%)]'
            buttonGradientClassName = 'bg-[linear-gradient(to_bottom,_#FF0000_0%,_#FF0000_21%,_#FF0000_50%,_#FF0000_100%)]'
            shineGradientClassName = 'bg-[linear-gradient(to_bottom,_rgba(255,255,255,0.31)_0%,_rgba(255,255,255,0.18)_100%)]'
            break;
        case 'purple':
            containerGradientClassName = 'bg-[linear-gradient(to_bottom,_#AEB2FF_0%,_#4257AC_20%,_#192073_92%)]'
            buttonGradientClassName = 'bg-[linear-gradient(to_bottom,_#800080_0%,_#800080_21%,_#800080_50%,_#800080_100%)]'
            shineGradientClassName = 'bg-[linear-gradient(to_bottom,_rgba(255,255,255,0.31)_0%,_rgba(255,255,255,0.18)_100%)]'
            break;
        default:
            return <div className={`text-red-500 bg-black ${className}`}>INVALID BTN COLOR</div>
    }

    return (
        // <button
        //     {...props}
        //     className={`w-[300px] text-white rounded-sm p-[3px] ${containerGradientClassName} border-[#030303] border-2 shadow-[0px_2px_0px_rgba(0,0,0,0.45)] ${className || ''}`}
        // >
        //     <div className={`w-full h-full flex justify-center items-center relative rounded-sm ${buttonGradientClassName} p-2`}>
        //         <div className={`absolute top-0 left-0 w-full h-[15px] p-1 ${shineClassName || ''}`}>
        //             <div className={`rounded-sm ${shineGradientClassName} w-full h-full`}></div>
        //         </div>
        //         <div className="relative z-10">{children}</div>
        //     </div>
        // </button>
        <button
            {...props}
            className={`text-white rounded-sm p-[5px] ${buttonGradientClassName} border-[#030303] border-2 shadow-[0px_2px_0px_rgba(0,0,0,0.45)] ${className || ''}`}
        >
            {children}
        </button>
    )
}

export default PrimaryButton