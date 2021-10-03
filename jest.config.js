/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  rootDir: ".",
  preset: "ts-jest",
  testEnvironment: "node",
  transformIgnorePatterns: ["/node_modules/(?!error-result).+\\.js$"],
  moduleFileExtensions: ["js", "ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
    "^.+\\.js$": "babel-jest",
  },
  testRegex: [/test\.(ts|js)$/],
  moduleNameMapper: {
    "@Root/(.*)": "<rootDir>/src/$1",
    "@Api/(.*)": "<rootDir>/src/API/$1",
    "@Data/(.*)": "<rootDir>/src/Data/$1",
    "@Endpoints/(.*)": "<rootDir>/src/Endpoints/$1",
    "@Hooks/(.*)": "<rootDir>/src/Hooks/$1",
    "@Routines/(.*)": "<rootDir>/src/Routines/$1",
    "@Utils/(.*)": "<rootDir>/src/Utils/$1",
    "@Workers/(.*)": "<rootDir>/src/Workers/$1",
    "@Mocks/(.*)": "<rootDir>/__mocks__/$1",
  },
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.tests.json",
    },
  },
};
