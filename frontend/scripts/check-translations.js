#!/usr/bin/env node

/**
 * This script checks if all translation keys are present in all locale files.
 * It will fail the build if any keys are missing.
 */

const fs = require('fs');
const path = require('path');

// Path to the locales directory
const localesDir = path.resolve(__dirname, '../src/i18n/locales');

// Get all locale files
const localeFiles = fs.readdirSync(localesDir)
  .filter(file => file.endsWith('.json'))
  .map(file => path.join(localesDir, file));

if (localeFiles.length === 0) {
  console.error('No locale files found!');
  process.exit(1);
}

// Parse all locale files
const locales = {};
localeFiles.forEach(file => {
  const localeName = path.basename(file, '.json');
  try {
    const content = fs.readFileSync(file, 'utf8');
    locales[localeName] = JSON.parse(content);
  } catch (error) {
    console.error(`Error parsing ${file}: ${error.message}`);
    process.exit(1);
  }
});

// Use the first locale as reference
const referenceLocaleName = Object.keys(locales)[0];
const referenceLocale = locales[referenceLocaleName];

// Function to get all keys from a nested object
function getAllKeys(obj, prefix = '') {
  return Object.keys(obj).reduce((keys, key) => {
    const currentKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      return [...keys, ...getAllKeys(obj[key], currentKey)];
    }
    return [...keys, currentKey];
  }, []);
}

// Get all keys from the reference locale
const referenceKeys = getAllKeys(referenceLocale);

// Check if all keys are present in all locales
let hasErrors = false;
Object.keys(locales).forEach(localeName => {
  if (localeName === referenceLocaleName) return;
  
  const locale = locales[localeName];
  const localeKeys = getAllKeys(locale);
  
  // Check for missing keys
  const missingKeys = referenceKeys.filter(key => !localeKeys.includes(key));
  if (missingKeys.length > 0) {
    console.error(`\nMissing keys in ${localeName}:`);
    missingKeys.forEach(key => console.error(`  - ${key}`));
    hasErrors = true;
  }
  
  // Check for extra keys
  const extraKeys = localeKeys.filter(key => !referenceKeys.includes(key));
  if (extraKeys.length > 0) {
    console.warn(`\nExtra keys in ${localeName} (not in reference locale ${referenceLocaleName}):`);
    extraKeys.forEach(key => console.warn(`  - ${key}`));
  }
});

// Function to get a nested value from an object using a dot-notation path
function getNestedValue(obj, path) {
  return path.split('.').reduce((o, i) => o && o[i], obj);
}

// Check for empty values
Object.keys(locales).forEach(localeName => {
  const locale = locales[localeName];
  const emptyKeys = referenceKeys.filter(key => {
    const value = getNestedValue(locale, key);
    return value === '' || value === null || value === undefined;
  });
  
  if (emptyKeys.length > 0) {
    console.error(`\nEmpty values in ${localeName}:`);
    emptyKeys.forEach(key => console.error(`  - ${key}`));
    hasErrors = true;
  }
});

if (hasErrors) {
  console.error('\nTranslation check failed! Please fix the issues above.');
  process.exit(1);
} else {
  console.log('\nAll translations are complete!');
}