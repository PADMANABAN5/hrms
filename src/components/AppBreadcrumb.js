import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import routes from '../routes'

import { CBreadcrumb, CBreadcrumbItem } from '@coreui/react'

const AppBreadcrumb = () => {
  const currentLocation = useLocation().pathname
  const navigate = useNavigate()
  const [secondsLeft, setSecondsLeft] = useState(15 * 60)
  const getRouteName = (pathname, routes) => {
    const currentRoute = routes.find((route) => route.path === pathname)
    return currentRoute ? currentRoute.name : false
  }
  useEffect(() => {
    const sessionStart = parseInt(localStorage.getItem('sessionStartTime'), 10)

    if (!sessionStart || isNaN(sessionStart)) {
      alert('Session expired or invalid. Please login again.')
      navigate('/login')
      return
    }

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - sessionStart) / 1000)
      const remaining = 15 * 60 - elapsed
      if (remaining <= 0) {
        clearInterval(timer)
        alert('⏰ Session expired. Please login again.')
        localStorage.removeItem('jwt_token')
        localStorage.removeItem('sessionStartTime')
        navigate('/login')
      } else {
        setSecondsLeft(remaining)
      }
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [navigate])

  const formatTime = (secs) => {
    const min = String(Math.floor(secs / 60)).padStart(2, '0')
    const sec = String(secs % 60).padStart(2, '0')
    return `${min}:${sec}`
  }
  const getBreadcrumbs = (location) => {
    const breadcrumbs = []
    location.split('/').reduce((prev, curr, index, array) => {
      const currentPathname = `${prev}/${curr}`
      const routeName = getRouteName(currentPathname, routes)
      routeName &&
        breadcrumbs.push({
          pathname: currentPathname,
          name: routeName,
          active: index + 1 === array.length ? true : false,
        })
      return currentPathname
    })
    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs(currentLocation)

  return (
    <CBreadcrumb className="my-0">
      <CBreadcrumbItem href="/">Home</CBreadcrumbItem>
      {breadcrumbs.map((breadcrumb, index) => {
        return (
          <CBreadcrumbItem
            {...(breadcrumb.active ? { active: true } : { href: breadcrumb.pathname })}
            key={index}
          >
            {breadcrumb.name}
          </CBreadcrumbItem>
        )
      })}
      <CBreadcrumbItem className="ms-auto">
        <span className="text-muted">Session expires in: {formatTime(secondsLeft)}</span>
      </CBreadcrumbItem>
    </CBreadcrumb>
  )
}

export default React.memo(AppBreadcrumb)
