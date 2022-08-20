module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true,
        "node": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/eslint-recommended"
    ],
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "rules": {
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": [2, {
            "args": "all",
            "argsIgnorePattern": "^_"
        }],
        "semi": [2, "always"],
        "no-extra-parens": [2, "all"],
        "key-spacing": [2, {
            "beforeColon": false,
            "afterColon": true
        }],
        "@typescript-eslint/indent": ["error", 4],
        "arrow-parens": ["error", "as-needed"],
        "comma-dangle": ["error", "never"],
        "@typescript-eslint/comma-dangle": ["error", "never"],
        "@typescript-eslint/explicit-function-return-type": ["error"],
        "no-console": ["error", {
            allow: ["warn", "error", "info", "debug"]
        }],
        "no-multi-spaces": ["error", {
            ignoreEOLComments: false
        }],
        "no-multiple-empty-lines": ["error", {
            "max": 1,
            "maxEOF": 0
        }]
    }
};