# Changelog

All notable changes to this project will be documented in this file.

## [2026-03-23]

### Added
- **Reference Tab Enhancements**:
    - Added "Opening Range (OR)" card explaining the 9:30 AM - 10:00 AM NY session range.
    - Added "Fair Value Gaps (FVG)" section covering SIBI, BISI, Inversion FVG, iFVG, Common FVG, Breakaway FVG, and Measuring FVG.
- **Custom Logo & Image Support**:
    - Implemented App Logo upload functionality in the Profile Modal.
    - Updated `AuthContext` to persist `app_logo_url` in user metadata.
    - Sidebar and Mobile Header now dynamically display the custom app logo.

### Fixed
- **Reference Tab Tooltip**: Fixed hover behavior where the tooltip would show when hovering over the entire card. It now correctly only triggers when hovering over the "i" information icon.
- **Mobile UI Fixes**:
    - **Navigation Icon**: Fixed issue where the mobile menu icon was being covered or difficult to access. Increased z-index and improved header layout.
    - **Dashboard Dropdown**: Corrected the account selector dropdown icon positioning on mobile to ensure it stays within the container.
- **Trade Journal Spacing**: Increased spacing between "Clear All", Account Selector, and "New Trade" buttons for better usability on all screen sizes.

### Enhanced
- **Market Intelligence (News Tab)**:
    - **Day-by-Day Separators**: Grouped economic events by date for better scannability.
    - **Fear & Greed Barometer**: Added a visual gauge for market sentiment.
    - **Asset Seasonality**: Added historical trend analysis for USD, ES, NQ, and Gold.
    - **Live Headlines Feed**: Integrated real-time financial news headlines.
    - **Bento Grid Layout**: Redesigned the tab with a high-density, responsive grid.
- **Economic News Tab**: Added a new dedicated tab for US Economic News.
    - Fetches real-time data from Forex Factory.
    - Filters for High and Medium impact events.
    - Features a custom UI with impact-coded accents and background glow effects.
    - **AI Fallback**: Implemented Gemini-powered fallback with Google Search for high reliability.
- **Reference Tab UI**:
    - Applied distinct color-coded accents (Blue, Orange, Purple, Emerald) to major sections for better visual hierarchy.
    - Redesigned sections with improved card layouts, micro-labels, and background glow effects.
    - Enhanced scannability of Time Based Liquidity, Opening Range, and FVG sections.

### Technical Details
- Images are currently stored as Base64 strings in the browser's `localStorage` (via Supabase mock implementation).
- Layout components updated to use dynamic URLs from user metadata for branding.
