# cycle-router

![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)

cycle-router is a driver for Cycle.js that allows to add multiple views and handle routing.

- Navigate with path or name
- BeforeEach hook
- Hash mode

### Installation

```sh
$ npm install @hollwann/cycle-router
```

### Usage

The usage is as simple as any other driver, here is an example of the main function using cycle-router.

```javascript
import { makeDOMDriver } from '@cycle/dom'
import makeRouterDriver from '@hollwann/cycle-router'
import routerConfig from './routerConfig'
import run from '@cycle/run'

const main = (sources) => {
  const routerView = sources.router.currentView(sources)

  const sinks = {
    DOM: routerView.select('DOM'),
    router: routerView.select('router')
  }
  return sinks
}

const drivers = {
  DOM: makeDOMDriver('#app'),
  router: makeRouterDriver(routerConfig)
}
run(main, drivers)
```

You pass all the sources to your view and then you get the sinks returned. With `routerView.select` you can get any sink you get from that view.

You must specify a configuration file which should look like this.

```typescript
import Home from './views/Home'
import Login from './views/Login'

const routes = [
  {
    path: '/',
    name: 'home',
    view: Home,
    meta: {
      /*meta prop is optional*/ requiresAuth: true
    }
  },
  {
    path: '/login',
    name: 'login',
    view: Login
  }
]

const beforeEach = (routeTo) => {
  //This is just an example
  const currentUser = 'user' //some valid user here
  const authRequired = routeTo.meta.authRequired

  if (authRequired && currentUser) return { name: RouteTo.name }
  else if (authRequired && !currentUser) return { name: 'login' }
  return { name: routeTo.name }
}
export default { routes, defaultView: Home, /*optional*/ beforeEach }
```

`beforeEach` is an optional function, which is executed before entering a new route.

You can navigate passing a stream of objects to the router sink, whit the name of the route or ther path. A simple example could be:
`xs.of({name:'home'})`


## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2020, Hollwann
