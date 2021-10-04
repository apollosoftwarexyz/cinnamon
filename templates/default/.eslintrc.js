module.exports = {
    'env': {
        'es2021': true,
        'node': true
    },
    'extends': [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended'
    ],
    'parser': '@typescript-eslint/parser',
    'parserOptions': {
        'ecmaVersion': 12,
        'sourceType': 'module'
    },
    'plugins': [
        '@typescript-eslint',
        'import-quotes'
    ],
    'rules': {
        'indent': [
            'error',
            4
        ],
        'linebreak-style': [
            'error',
            'unix'
        ],
        'brace-style': [
            'error',
            '1tbs', // THE ONE TRUE BRACE STYLE
            {'allowSingleLine': true}
        ],
        'lines-around-comment': [
            'error',
            {'beforeBlockComment': true}
        ],

        'quotes': [
            'error',
            'single',
            {
                'avoidEscape': true,
                'allowTemplateLiterals': true
            }
        ],

        'import-quotes/import-quotes': [
            'error',
            'single'
        ],
        'semi': [
            'error',
            'always'
        ],
        'no-console': [
            'error'
        ],

        '@typescript-eslint/no-explicit-any': 'off'
    }
};
