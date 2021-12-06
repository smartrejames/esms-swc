import { expect } from 'chai'

interface Animal {
  eat(food: unknown): void
}

abstract class Mammal implements Animal {
  eat(food: Food): void {
    throw Error('Not Implemented')
  }
}

class Dog extends Mammal {}

describe('Dog', () => {
  it('should throw on abstract method', () => {
    expect(() => {
      new Dog().eat({})
    }).to.be.throw('Not Implemented')
  })
})
