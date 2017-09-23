
class MockDocument {
  constructor (url) {
    this.data = undefined
    this.url = url
  }

  get () {
    return this.data
  }

  fetch () {
    return new Promise((resolve) => {
      this.data = {url: this.url}
      resolve()
    })
  }
}

export default MockDocument
