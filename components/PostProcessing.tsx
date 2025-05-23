import { settingsAtom } from "@/atoms";
import {
    EffectComposer,
    SMAA,
    FXAA,
    Bloom,
    HueSaturation,
    ChromaticAberration,
    DepthOfField,
    Noise,
    SSAO,
    Vignette,
    BrightnessContrast,
    DotScreen,
    Glitch,
    Pixelation,
    Scanline,
    ToneMapping,
} from "@react-three/postprocessing";
import { useAtomValue } from "jotai";
import { Leva, useControls } from "leva";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import * as THREE from "three";

const levaTheme = {
    colors: {
        label: "#ffffff",
        folderWidgetColor: "#ffffff",
        highlight1: "#ffffff",
    },
} as const;

export const PostProcessingMenu = ({ collapsed = false }: { collapsed?: boolean }) => {
    return (
        <Leva theme={levaTheme} collapsed={collapsed} titleBar={collapsed ? { position: { x: 0, y: 500 } } : undefined} />
    )
}

export const PostProcessingEffects = () => {
    const settings = useAtomValue(settingsAtom);

    // Bloom -----------------------------------------------------------------------
    const bloom = useControls(
        "Bloom",
        {
            enabled: false,
            intensity: { value: 0.26, min: 0, max: 3 },
            radius: { value: 0, min: 0, max: 2 },
            threshold: { value: 0, min: 0, max: 1 },
        },
        { collapsed: true },
    );


    const toneMapping = useControls(
        "Tone Mapping",
        {
            enabled: true,
            mode: { value: ToneMappingMode.ACES_FILMIC, options: ToneMappingMode },
            blendFunction: { value: BlendFunction.NORMAL, options: BlendFunction },
            // adaptive: { value: false },
            // resolution: { value: 256 },
            middleGrey: { value: 0.6 },
            minLuminance: { value: 0.01 },
            maxLuminance: { value: 4.0 },
            whitePoint: { value: 4.0 },
            averageLuminance: { value: 1.0 },
            adaptationRate: { value: 1.0 },
            opacity: { value: 1.0 },
        },
        { collapsed: true },
    );

    // Depth‑of‑Field --------------------------------------------------------------
    const dof = useControls(
        "Depth of Field",
        {
            enabled: false,
            focusDistance: { value: 0.02, min: 0, max: 1, label: "focus" },
            focalLength: { value: 0.02, min: 0, max: 1, label: "focal" },
            bokehScale: { value: 2, min: 0, max: 10 },
        },
        { collapsed: true },
    );

    // Chromatic Aberration --------------------------------------------------------
    const chroma = useControls(
        "Chromatic Aberration",
        {
            enabled: false,
            offset: { value: 0.0015, min: 0, max: 0.02 },
        },
        { collapsed: true },
    );

    // Vignette --------------------------------------------------------------------
    const vignette = useControls(
        "Vignette",
        {
            enabled: false,
            eskil: true,
            offset: { value: 0.1, min: 0, max: 1 },
            darkness: { value: 1.1, min: 0, max: 3 },
        },
        { collapsed: true },
    );

    // Noise -----------------------------------------------------------------------
    const noise = useControls(
        "Noise",
        {
            enabled: false,
            premultiply: false,
            opacity: { value: 0.1, min: 0, max: 1 },
        },
        { collapsed: true },
    );

    // SSAO ------------------------------------------------------------------------
    const ssao = useControls(
        "SSAO",
        {
            enabled: false,
            samples: { value: 6, min: 1, max: 32, step: 1 },
            radius: { value: 0.1, min: 0, max: 2 },
            intensity: { value: 20, min: 0, max: 50 },
        },
        { collapsed: true },
    );

    // ───────── Additional FX ─────────────────────────────────────────────────────

    // Hue / Saturation ------------------------------------------------------------
    const hueSat = useControls(
        "Hue & Saturation",
        {
            enabled: false,
            hue: { value: 0, min: -Math.PI, max: Math.PI },
            saturation: { value: 0, min: -1, max: 1 },
        },
        { collapsed: true },
    );

    // Brightness / Contrast -------------------------------------------------------
    const brCon = useControls(
        "Brightness & Contrast",
        {
            enabled: false,
            brightness: { value: -0.07, min: -1, max: 1 },
            contrast: { value: 0, min: -1, max: 1 },
        },
        { collapsed: true },
    );

    // Pixelation ------------------------------------------------------------------
    const pixel = useControls(
        "Pixelation",
        {
            enabled: false,
            granularity: { value: 4, min: 1, max: 16, step: 1 },
        },
        { collapsed: true },
    );

    // DotScreen -------------------------------------------------------------------
    const dot = useControls(
        "Dot Screen",
        {
            enabled: false,
            scale: { value: 1, min: 0.5, max: 3 },
            angle: { value: 1.57, min: 0, max: Math.PI * 2 },
        },
        { collapsed: true },
    );

    // Scanline --------------------------------------------------------------------
    const scan = useControls(
        "Scanline",
        {
            enabled: false,
            density: { value: 1, min: 0.2, max: 6 },
            blend: { value: true },
        },
        { collapsed: true },
    );

    // Glitch ----------------------------------------------------------------------
    const glitch = useControls(
        "Glitch",
        {
            enabled: false,
            minDelay: { value: 1, min: 0.1, max: 5 },
            maxDelay: { value: 5, min: 0.5, max: 10 },
            minDuration: { value: 0.6, min: 0.1, max: 5 },
            maxDuration: { value: 1.0, min: 0.1, max: 5 },
            strength: { value: 0.3, min: 0, max: 1 },
            mode: {
                options: {
                    SPORADIC: "SPORADIC",
                    CONSTANT_MILD: "CONSTANT_MILD",
                    CONSTANT_WILD: "CONSTANT_WILD",
                },
                value: "SPORADIC",
            },
        },
        { collapsed: true },
    );

    // SMAA (anti‑alias) -----------------------------------------------------------
    const smaa = useControls(
        "SMAA",
        {
            enabled: false,
        },
        { collapsed: true },
    );

    const fxaa = useControls(
        "FXAA",
        {
            enabled: false,
        },
        { collapsed: true },
    );



    if (!settings.postProcessing) return null;

    return (
        <EffectComposer enableNormalPass={false} multisampling={8}>
            {toneMapping.enabled ? (
                <ToneMapping mode={toneMapping.mode}
                    blend={toneMapping.blendFunction}
                    middleGrey={toneMapping.middleGrey}
                    maxLuminance={toneMapping.maxLuminance}
                    averageLuminance={toneMapping.averageLuminance}
                    adaptationRate={toneMapping.adaptationRate}
                    minLuminance={toneMapping.minLuminance}
                    whitePoint={toneMapping.whitePoint}
                    opacity={toneMapping.opacity}
                />
            ) : <></>}

            {/* Base effects */}
            {bloom.enabled ? (
                <Bloom
                    intensity={bloom.intensity}
                    radius={bloom.radius}
                    luminanceThreshold={bloom.threshold}
                />
            ) : <></>}
            {dof.enabled ? (
                <DepthOfField
                    focusDistance={dof.focusDistance}
                    focalLength={dof.focalLength}
                    bokehScale={dof.bokehScale}
                />
            ) : <></>}
            {chroma.enabled ? (
                <ChromaticAberration
                    offset={new THREE.Vector2(chroma.offset, chroma.offset)}
                />
            ) : <></>}
            {vignette.enabled ? (
                <Vignette
                    eskil={vignette.eskil}
                    offset={vignette.offset}
                    darkness={vignette.darkness}
                />
            ) : <></>}

            {/* ————— extra FX ———— */}
            {noise.enabled ? (
                <Noise premultiply={noise.premultiply} opacity={noise.opacity} />
            ) : <></>}

            {ssao.enabled ? (
                <SSAO
                    samples={ssao.samples}
                    radius={ssao.radius}
                    intensity={ssao.intensity}
                />
            ) : <></>}

            {hueSat.enabled ? (
                <HueSaturation hue={hueSat.hue} saturation={hueSat.saturation} />
            ) : <></>}

            {brCon.enabled ? (
                <BrightnessContrast
                    brightness={brCon.brightness}
                    contrast={brCon.contrast}
                />
            ) : <></>}

            {pixel.enabled ? <Pixelation granularity={pixel.granularity} /> : <></>}

            {dot.enabled ? <DotScreen scale={dot.scale} angle={dot.angle} /> : <></>}

            {scan.enabled ? <Scanline density={scan.density} blend={scan.blend} /> : <></>}

            {glitch.enabled ? (
                <Glitch
                    delay={new THREE.Vector2(glitch.minDelay, glitch.maxDelay)}
                    duration={new THREE.Vector2(glitch.minDuration, glitch.maxDuration)}
                    strength={new THREE.Vector2(glitch.strength, glitch.strength)}
                    mode={glitch.mode as any}
                />
            ) : <></>}

            {smaa.enabled ? <SMAA /> : <></>}
            {fxaa.enabled ? <FXAA /> : <></>}
        </EffectComposer>
    );
};
