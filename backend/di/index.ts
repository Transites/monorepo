/**
 * Dependency Injection Module
 *
 * This module exports the DI container and registry for use throughout the application.
 */

import { Container, Lifetime } from './container';
import { resolve, registerDependencies } from './registry';

export {
  Container,
  Lifetime,
  resolve,
  registerDependencies
};
