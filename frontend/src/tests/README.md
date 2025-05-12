# Frontend Testing Guide

This document provides guidance on the testing approach for the frontend components, with a focus on preparing for TypeScript migration.

## Testing Setup

The project uses the following testing tools:

- **Vitest**: A Vite-native testing framework that's fast and compatible with the Jest API
- **Vue Test Utils**: The official testing library for Vue.js
- **JSDOM**: A JavaScript implementation of the DOM for testing in a Node.js environment
- **Testing Library**: Provides utilities for testing UI components in a user-centric way

## Running Tests

Tests can be run using the following npm scripts:

- `npm run test`: Runs Vitest in watch mode for development
- `npm run test:unit`: Runs all tests once
- `npm run test:coverage`: Runs all tests with coverage reporting

## Test Structure

Tests are organized in the following directory structure:

```
src/
└── tests/
    ├── components/    # Tests for Vue components
    ├── store/         # Tests for Vuex store modules (to be added)
    ├── services/      # Tests for API services (to be added)
    └── utils/         # Tests for utility functions (to be added)
```

## Component Testing Approach

When testing Vue components, developers should follow these principles:

1. **Test behavior, not implementation**: Focus on what the component does, not how it's built
2. **Use meaningful assertions**: Test that components render the right content and respond correctly to user interactions
3. **Stub external dependencies**: Use stubs for Vuetify components to isolate the component being tested

### Testing Vuetify Components

When testing components that use Vuetify, Vuetify components need to be stubbed. Here's an example:

```javascript
const wrapper = mount(MyComponent, {
  global: {
    stubs: {
      'v-btn': {
        template: '<button class="v-btn-stub"><slot /></button>',
        props: ['color', 'icon']
      }
    }
  }
});
```

## Preparing for TypeScript Migration

As preparation for migration to TypeScript continues, developers should keep these points in mind:

1. **Write type-aware tests**: Even in JavaScript, tests should be structured to be easily convertible to TypeScript
2. **Test prop validation**: Components should validate their props correctly
3. **Document expected types**: JSDoc comments should be used to document expected types
4. **Test edge cases**: Components should handle null, undefined, and unexpected values gracefully

## Example Test

Here's an example of a component test:

```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from '@/components/MyComponent.vue'

describe('MyComponent.vue', () => {
  it('renders correctly with props', () => {
    const wrapper = mount(MyComponent, {
      props: {
        title: 'Test Title'
      }
    })
    
    expect(wrapper.text()).toContain('Test Title')
  })
  
  it('emits an event when button is clicked', async () => {
    const wrapper = mount(MyComponent)
    
    await wrapper.find('button').trigger('click')
    
    expect(wrapper.emitted('click')).toBeTruthy()
  })
})
```

## Next Steps

1. Continue adding tests for remaining components
2. Add tests for Vuex store modules
3. Add tests for API services
4. Add tests for utility functions
5. Begin TypeScript migration with confidence that behavior is preserved
