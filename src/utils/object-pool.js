/**
 * Object Pool Utility
 * 
 * This utility provides a simple object pooling system to reduce garbage collection
 * by reusing objects instead of creating and destroying them repeatedly.
 */

export class ObjectPool {
  /**
   * Create a new ObjectPool instance
   * 
   * @param {Function} factory - Function that creates new objects
   * @param {Function} reset - Function that resets objects to their initial state
   * @param {number} initialSize - Initial size of the pool (default: 10)
   */
  constructor(factory, reset, initialSize = 10) {
    this.factory = factory;
    this.reset = reset;
    this.pool = [];
    
    // Pre-populate the pool with initial objects
    this.populate(initialSize);
  }
  
  /**
   * Populate the pool with a specified number of objects
   * 
   * @param {number} count - Number of objects to add to the pool
   */
  populate(count) {
    for (let i = 0; i < count; i++) {
      this.pool.push(this.factory());
    }
  }
  
  /**
   * Get an object from the pool
   * If the pool is empty, a new object will be created
   * 
   * @returns {Object} An object from the pool
   */
  get() {
    // If the pool is empty, create a new object
    if (this.pool.length === 0) {
      return this.factory();
    }
    
    // Otherwise, get an object from the pool
    return this.pool.pop();
  }
  
  /**
   * Return an object to the pool
   * 
   * @param {Object} object - The object to return to the pool
   */
  release(object) {
    // Reset the object to its initial state
    this.reset(object);
    
    // Add it back to the pool
    this.pool.push(object);
  }
  
  /**
   * Get the current size of the pool
   * 
   * @returns {number} The number of objects currently in the pool
   */
  size() {
    return this.pool.length;
  }
  
  /**
   * Clear the pool
   */
  clear() {
    this.pool = [];
  }
}
