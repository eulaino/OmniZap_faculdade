import { darkTheme, getAppTheme, getThemeForPreference, lightTheme } from './appTheme';

if (getAppTheme('dark') !== darkTheme) {
  throw new Error('Expected dark color scheme to use dark theme');
}

if (getAppTheme('light') !== lightTheme) {
  throw new Error('Expected light color scheme to use light theme');
}

if (getAppTheme(null) !== lightTheme) {
  throw new Error('Expected missing color scheme to fall back to light theme');
}

if (darkTheme.colors.card === lightTheme.colors.card) {
  throw new Error('Expected dark and light cards to have different colors');
}

if (getThemeForPreference('dark', 'light') !== darkTheme) {
  throw new Error('Expected dark preference to override light system theme');
}

if (getThemeForPreference('light', 'dark') !== lightTheme) {
  throw new Error('Expected light preference to override dark system theme');
}

if (getThemeForPreference('system', 'dark') !== darkTheme) {
  throw new Error('Expected system preference to follow system theme');
}
