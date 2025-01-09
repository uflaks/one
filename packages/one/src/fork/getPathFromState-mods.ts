/**
 * This file exports things that will be used to modify the forked code in `getPathFromState.ts`.
 *
 * The purpose of keeping things in this separated file is to keep changes to the copied code as little as possible, making merging upstream updates easier.
 */

import type { Route } from '@react-navigation/core'

import { matchDeepDynamicRouteName, matchDynamicName, matchGroupName } from '../router/matchers'

export type AdditionalOptions = {
  preserveDynamicRoutes?: boolean
  preserveGroups?: boolean
  shouldEncodeURISegment?: boolean
}

export type ConfigItemMods = {
  // Used as fallback for groups
  initialRouteName?: string
}

export function getPathWithConventionsCollapsed({
  pattern,
  route,
  params,
  preserveGroups,
  preserveDynamicRoutes,
  shouldEncodeURISegment = true,
  initialRouteName,
}: AdditionalOptions & {
  pattern: string
  route: Route<any>
  params: Record<string, any>
  initialRouteName?: string
}) {
  const segments = pattern.split('/');

  return segments
    .map((p, i) => {
      const name = getParamName(p)

      // Showing the route name seems ok, though whatever we show here will be incorrect
      // Since the page doesn't actually exist
      if (p.startsWith('*')) {
        if (preserveDynamicRoutes) {
          if (name === 'not-found') {
            return '+not-found'
          }

          return `[...${name}]`
        }

        if (params[name]) {
          if (Array.isArray(params[name])) {
            return params[name].join('/')
          }
          return params[name]
        }

        if (route.name.startsWith('[') && route.name.endsWith(']')) {
          return ''
        }

        if (p === '*not-found') {
          return ''
        }

        return route.name
      }

      // If the path has a pattern for a param, put the param in the path
      if (p.startsWith(':')) {
        if (preserveDynamicRoutes) {
          return `[${name}]`
        }
        // Optional params without value assigned in route.params should be ignored
        const value = params[name]
        if (value === undefined && p.endsWith('?')) {
          return
        }

        return (shouldEncodeURISegment ? encodeURISegment(value) : value) ?? 'undefined'
      }

      if (!preserveGroups && matchGroupName(p) != null) {
        // When the last part is a group it could be a shared URL
        // if the route has an initialRouteName defined, then we should
        // use that as the component path as we can assume it will be shown.
        if (segments.length - 1 === i) {
          if (initialRouteName) {
            // Return an empty string if the init route is ambiguous.
            if (segmentMatchesConvention(initialRouteName)) {
              return ''
            }
            return shouldEncodeURISegment
              ? encodeURISegment(initialRouteName, { preserveBrackets: true })
              : initialRouteName
          }
        }
        return ''
      }
      // Preserve dynamic syntax for rehydration
      return shouldEncodeURISegment ? encodeURISegment(p, { preserveBrackets: true }) : p
    })
    .map((v) => v ?? '')
    .join('/')
}

export const getParamName = (pattern: string) => pattern.replace(/^[:*]/, '').replace(/\?$/, '')

export function appendBaseUrl(
  path: string,
  baseUrl: string | undefined = process.env.EXPO_BASE_URL
) {
  if (process.env.NODE_ENV !== 'development') {
    if (baseUrl) {
      return `/${baseUrl.replace(/^\/+/, '').replace(/\/$/, '')}${path}`
    }
  }
  return path
}

function segmentMatchesConvention(segment: string): boolean {
  return (
    segment === 'index' ||
    matchDynamicName(segment) != null ||
    matchGroupName(segment) != null ||
    matchDeepDynamicRouteName(segment) != null
  )
}

function encodeURISegment(str: string, { preserveBrackets = false } = {}) {
  // Valid characters according to
  // https://datatracker.ietf.org/doc/html/rfc3986#section-3.3 (see pchar definition)
  str = String(str).replace(/[^A-Za-z0-9\-._~!$&'()*+,;=:@]/g, (char) => encodeURIComponent(char))

  if (preserveBrackets) {
    // Preserve brackets
    str = str.replace(/%5B/g, '[').replace(/%5D/g, ']')
  }
  return str
}