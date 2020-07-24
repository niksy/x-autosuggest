# Changelog

## [Unreleased][]

## [1.5.0][] - 2020-07-24

### Added

-   Support for handling focus event on input element

## [1.4.0][] - 2019-11-22

### Added

-   Support for additional HTML class namespace

### Changed

-   `keycode-js` upgrade

### Fixed

-   Handling rendering edge cases when testing in IE 11

## [1.3.1][] - 2019-09-12

### Fixed

-   Adjust fixed value regardless of decorated `input` event
-   Handle input reference on next tick to handle early undefined DOM element
    reference

## [1.3.0][] - 2019-09-12

### Changed

-   Prevent default action if `Enter` key is pressed when selecting option (this
    avoids submitting parent `form` element)

## [1.2.2][] - 2019-09-10

### Fixed

-   `focusout` instead of `blur` event for IE11 compatibility

## [1.2.1][] - 2019-09-10

### Fixed

-   Blur event handling when selecting option

### Removed

-   Unecessary `keyup` event handler

## [1.2.0][] - 2019-09-10

### Added

-   Support for option meta information
-   Test for blur event

## [1.1.1][] - 2019-09-09

### Fixed

-   Side effect reference

## [1.1.0][] - 2019-09-09

### Fixed

-   Initial element value should be reused

## [1.0.1][] - 2019-09-09

### Fixed

-   Escape key action prevention on `input[type="search"]`
-   Memoization example in docs

### Changed

-   Blur event uses user input value and hides dropdown list

## [1.0.0][] - 2019-07-29

### Added

-   Initial implementation

[unreleased]: https://github.com/niksy/x-autosuggest/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/niksy/x-autosuggest/compare/v1.3.1...v1.4.0
[1.3.1]: https://github.com/niksy/x-autosuggest/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/niksy/x-autosuggest/compare/v1.2.2...v1.3.0
[1.2.2]: https://github.com/niksy/x-autosuggest/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/niksy/x-autosuggest/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/niksy/x-autosuggest/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/niksy/x-autosuggest/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/niksy/x-autosuggest/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/niksy/x-autosuggest/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/niksy/x-autosuggest/tree/v1.0.0
[unreleased]: https://github.com/niksy/x-autosuggest/compare/v1.5.0...HEAD
[1.5.0]: https://github.com/niksy/x-autosuggest/tree/v1.5.0
