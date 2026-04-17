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
  true: 14, // Bắt buộc phải có
}
const tokens = createTokens({
    color: {
        jade1: '#34eb80',
        jade2: '#28d06f',
        white: '#ffffff',
        black: '#000000',
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
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
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
        primary: tokens.color.jade1,
        background: tokens.color.white,
        color: tokens.color.black,
    },

    dark: {
        primary: tokens.color.jade2,
        background: tokens.color.black,
        color: tokens.color.white,
    }
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
        allowedStyleValues: false,
    },
})

type Conf = typeof config
declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}

export default config