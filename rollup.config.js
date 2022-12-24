const terser = require('@rollup/plugin-terser');

module.exports = {
    input: 'src/index.js',
    output: [
        {
            file: 'dist/set-codec-preferences-polyfill.js',
            format: 'iife'
        },
        {
            file: 'dist/set-codec-preferences-polyfill.min.js',
            format: 'iife',
            plugins: [terser()]
        }
    ]
};
