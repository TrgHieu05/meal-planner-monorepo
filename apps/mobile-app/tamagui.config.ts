import { createTokens, createTamagui, createFont } from 'tamagui'
import { shorthands } from '@tamagui/shorthands'

const commonFontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  h1: 40,
  h2: 32,
  h3: 24,
  h4: 20,
  true: 14,
}

const tokens = createTokens({
    color: {
        jade1: '#E6F9F4',
        jade2: '#B8EDDF',
        jade3: '#8AE2CB',
        jade4: '#5CD6B6',
        jade5: '#2ECBA2',
        jade6: '#00bf8d', //base
        jade7: '#00A87C',
        jade8: '#00916B',
        jade9: '#007A5A',
        jade10: '#006349',
        jade11: '#004C38',

        red1: '#FCEBEB',
        red2: '#F6C6C6',
        red3: '#F0A2A2',
        red4: '#EA7E7E',
        red5: '#E45959',
        red6: '#de3535', //base
        red7: '#C32F2F',
        red8: '#A92828',
        red9: '#8E2222',
        red10: '#731C1C',
        red11: '#591515',

        gray1: '#FAFAFA',
        gray2: '#F4F4F4',
        gray3: '#EFEFEF',
        gray4: '#E9E9E9',  
        gray5: '#E3E3E3',
        gray6: '#DDDDDD',
        gray7: '#D7D7D7',   
        gray8: '#d1D1d1',
        gray9: '#B9B9B9',
        gray10: '#A1A1A1',
        gray11: '#717171',
        gray12: '#898989',
        gray13: '#5A5A5A', 
        gray14: '#424242',
        gray15: '#2A2A2A',

        // Other colors can be added here as needed
        yellow1: '#FDF7ED',
        yellow6: '#efac4e',

        purple1: '#F1EDFB',
        purple6: '#6f48db',

        green1: '#EEF8EC',
        green6: '#53ba45',

    },

    space: {
        0: 0,
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        true: 16,
    },

    radius: {
        none: 0,
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        pill: 999,
        true: 16,
    },

    size: {
        0: 0,
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        true: 16,
    },
    zIndex: {
        0: 0,
        Modal: 99,
        true:0
    },
})

const headingFont = createFont({
    family: 'BricolageGrotesque',
    size: {
        ...commonFontSizes,
        true: 24
    },
    weight: {
        light: '300', //same weight as 400, avoid using this
        regular: '400',
        medium: '500',
        semiBold: '600', //same weight as 500, avoid using this
        bold: '700',
        true: '400',
    },
    face: {
        300: { normal: 'BricolageGrotesque-Regular' },
        400: { normal: 'BricolageGrotesque-Regular' },
        500: { normal: 'BricolageGrotesque-Medium' },
        600: { normal: 'BricolageGrotesque-Medium' },
        700: { normal: 'BricolageGrotesque-Bold' },
    },
})

const bodyFont = createFont({
    family: 'DMSans',
    size: {
        ...commonFontSizes,
        true: 14,
    },
    weight: {
        light: '300',
        regular: '400',
        medium: '500',
        semiBold: '600',
        bold: '700', //same weight as 600, avoid using this
        true: '400',
    },
    face: {
        300: { normal: 'DMSans-Light' },
        400: { normal: 'DMSans-Regular' },
        500: { normal: 'DMSans-Medium' },
        600: { normal: 'DMSans-SemiBold' },
        700: { normal: 'DMSans-SemiBold' },
    },
})

const themes = {
    light: {
        background: tokens.color.gray1,

        surface: tokens.color.gray3,
        surfaceHover: tokens.color.gray4,
        surfacePress: tokens.color.gray5,

        primary: tokens.color.jade6,
        primaryHover: tokens.color.jade7,
        primaryPress: tokens.color.jade8,
        softPrimary: tokens.color.jade1,

        danger: tokens.color.red6,
        dangerHover: tokens.color.red7,
        dangerPress: tokens.color.red8,
        softDanger: tokens.color.red1,

        text: tokens.color.gray15,
        textSubtle: tokens.color.gray10,
        textPrimary: tokens.color.jade6,
        textDanger: tokens.color.red6,
        textInverse: tokens.color.gray1, //for text on colored backgrounds

        boderFocus: tokens.color.jade7,
    },

    dark: {
        background: tokens.color.gray15,

        surface: tokens.color.gray14,
        surfaceHover: tokens.color.gray13,
        surfacePress: tokens.color.gray12,

        primary: tokens.color.jade6,
        primaryHover: tokens.color.jade7,
        primaryPress: tokens.color.jade8,
        softPrimary: tokens.color.jade2,

        danger: tokens.color.red6,
        dangerHover: tokens.color.red7,
        dangerPress: tokens.color.red8,
        softDanger: tokens.color.red2,

        text: tokens.color.gray1,
        textSubtle: tokens.color.gray7,
        textPrimary: tokens.color.jade6,
        textDanger: tokens.color.red6,
        textInverse: tokens.color.gray1,

        boderFocus: tokens.color.jade7,
    },
}

const config = createTamagui({
    tokens,
    themes,
    fonts: {
        heading: headingFont,
        body: bodyFont,
    },
    defaultFont: 'body',
    shorthands,
    settings: {
        allowedStyleValues: true,
    },
})

type Conf = typeof config
declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}

export default config