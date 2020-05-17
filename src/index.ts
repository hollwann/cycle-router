import xs, { Stream, Listener } from 'xstream'
import isolate from '@cycle/isolate'

declare type viewProxies<So, Si> = (sources: SourcesProxies<So>) => SinkProxies<Si>

declare type SinkProxies<Si> = {
  [k in keyof Si]: Stream<any>
}
declare type SourcesProxies<So> = {
  [k in keyof So]: So[k]
}
declare type RouteObject<So, Si> = {
  path: string
  name: string
  view: viewProxies<So, Si>
  meta?: object
}
export type RouterConfig<So, Si> = {
  routes: Array<RouteObject<So, Si>>
  defaultView: viewProxies<So, Si>
  beforeEach?: (to: RouteObject<So, Si>) => { name: string } | { path: string }
}

export type PushRouteObject =
  | {
      name: string
      source: string
    }
  | {
      path: string
      source: string
    }

const makeRouterDriver = <So extends SourcesProxies<So>, Si extends SinkProxies<Si>>(
  routerConfig: RouterConfig<SourcesProxies<So>, SinkProxies<Si>>
) => {
  const routerDriver = (router$: Stream<PushRouteObject>) => {
    const goTo = (path: string) =>
      window.history.pushState({ path, source: 'history' }, '', `/#${path}`)

    const popstateHistory$ = xs.create({
      start: (listener: Listener<PushRouteObject>) => {
        window.onpopstate = (evt: any) => {
          listener.next(evt.state || { path: window.location.hash.slice(1), source: 'history' })
        }
      },
      stop: () => {}
    })

    const beforeEach = (a: RouteObject<So, Si>): PushRouteObject => {
      const routeBeforeEach = routerConfig.beforeEach
        ? routerConfig.beforeEach(a)
        : { path: a.path }
      return { ...routeBeforeEach, source: 'router' }
    }

    const getView = (route: PushRouteObject): viewProxies<So, Si> => {
      const routes = routerConfig.routes
      const defaultRoute = {
        path: '/404',
        name: '404',
        view: routerConfig.defaultView
      }
      const view =
        ('path' in route
          ? routes.find(r => r.path === route.path)
          : routes.find(r => r.name === route.name)) || defaultRoute

      const routeBeforeEach = beforeEach(view)
      if ('path' in routeBeforeEach && routeBeforeEach.path !== view.path)
        return getView(routeBeforeEach)
      else if ('name' in routeBeforeEach && routeBeforeEach.name !== view.name)
        return getView(routeBeforeEach)

      if (route.source === 'router') goTo(view.path)
      else window.history.replaceState({ path: view.path, source: 'history' }, '')

      return isolate(view.view)
    }

    if (!window.location.hash) window.history.replaceState({}, '', '/#/')
    const currentPath = window.location.hash.slice(1)

    const routerParsed$ = router$.map(a => ({ ...a, source: 'router' }))
    const routerHistory$ = xs
      .merge(routerParsed$, popstateHistory$)
      .startWith({ path: currentPath, source: 'history' })
      .map(getView)

    return {
      currentView: (sources: SourcesProxies<So>) => {
        const currentView$: Stream<SinkProxies<Si>> = routerHistory$.map(view => view(sources))
        return {
          select: (key: keyof SinkProxies<Si>) =>
            currentView$.map(sinks => sinks[key] || xs.empty()).flatten()
        }
      }
    }
  }
  return routerDriver
}

export type RouterSink = Stream<any>
export default makeRouterDriver
