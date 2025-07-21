/**
 * Simple Dependency Injection Container
 *
 * This container provides a way to register and resolve dependencies
 * with support for singleton and transient lifetimes.
 */

type Constructor<T> = new (...args: any[]) => T;
type Factory<T> = (...args: any[]) => T;
type Dependency<T> = Constructor<T> | Factory<T>;

enum Lifetime {
  SINGLETON,
  TRANSIENT
}

interface Registration<T> {
  dependency: Dependency<T>;
  lifetime: Lifetime;
  instance?: T;
}

class Container {
  private registrations: Map<string, Registration<any>> = new Map();
  private static instance: Container;

  private constructor() {}

  /**
   * Get the singleton instance of the container
   */
  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Register a dependency with singleton lifetime
   * @param token The token to register the dependency under
   * @param dependency The dependency constructor or factory function
   */
  public registerSingleton<T>(token: string, dependency: Dependency<T>): void {
    this.registrations.set(token, {
      dependency,
      lifetime: Lifetime.SINGLETON
    });
  }

  /**
   * Register a dependency with transient lifetime
   * @param token The token to register the dependency under
   * @param dependency The dependency constructor or factory function
   */
  public registerTransient<T>(token: string, dependency: Dependency<T>): void {
    this.registrations.set(token, {
      dependency,
      lifetime: Lifetime.TRANSIENT
    });
  }

  /**
   * Register an instance as a singleton
   * @param token The token to register the instance under
   * @param instance The instance to register
   */
  public registerInstance<T>(token: string, instance: T): void {
    this.registrations.set(token, {
      dependency: () => instance,
      lifetime: Lifetime.SINGLETON,
      instance
    });
  }

  /**
   * Resolve a dependency
   * @param token The token to resolve
   * @param args Additional arguments to pass to the constructor or factory
   * @returns The resolved dependency
   */
  public resolve<T>(token: string, ...args: any[]): T {
    const registration = this.registrations.get(token);

    if (!registration) {
      throw new Error(`Dependency not registered: ${token}`);
    }

    if (registration.lifetime === Lifetime.SINGLETON) {
      if (!registration.instance) {
        registration.instance = this.createInstance(registration.dependency, ...args);
      }
      return registration.instance;
    }

    return this.createInstance(registration.dependency, ...args);
  }

  /**
   * Create an instance of a dependency
   * @param dependency The dependency constructor or factory function
   * @param args Additional arguments to pass to the constructor or factory
   * @returns The created instance
   */
  private createInstance<T>(dependency: Dependency<T>, ...args: any[]): T {
    if (typeof dependency === 'function') {
      // Check if it's a constructor (class) or a factory function
      if (dependency.prototype && dependency.prototype.constructor === dependency) {
        // It's a constructor
        return new (dependency as Constructor<T>)(...args);
      } else {
        // It's a factory function
        return (dependency as Factory<T>)(...args);
      }
    }

    throw new Error('Invalid dependency type');
  }
}

export { Container, Lifetime };
