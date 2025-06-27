import React, { Suspense, useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

import { CSpinner, useColorModes } from '@coreui/react'
import './scss/style.scss'
import ProtectedRoute from './components/ProtectedRoute'
// We use those styles to show code examples, you should remove them in your application.
import './scss/examples.scss'
// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))

// Pages
const Login = React.lazy(() => import('./views/pages/login/Login'))
const Register = React.lazy(() => import('./views/pages/register/Register'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'))
const HR = React.lazy(() => import('./views/pages/HR/HumanResource'))
const CP = React.lazy(() => import('../src/ChangePassword/change_pass'))
const EMPLOYEE = React.lazy(() => import('./views/pages/EMPLOYEE/Employee'))
const Emp = React.lazy(() => import('./views/pages/Emp_management/Employee_management'))
const Payslip = React.lazy(() => import('./views/pages/Payslip/Payslip'))
const Generate = React.lazy(() => import('./views/pages/generate/generate'))
const Generated = React.lazy(() => import('./views/pages/Generated_payslip/generated_api'))
const ViewPayslip = React.lazy(() => import('./views/pages/viewpayslip/ViewPayslip'))

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const storedTheme = useSelector((state) => state.theme)
  const token = localStorage.getItem('jwt_token')
  const isLoggedIn = token !== null && token !== ''
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0]
    if (theme) {
      setColorMode(theme)
    }

    if (isColorModeSet()) {
      return
    }

    setColorMode(storedTheme)
  }, [])

  return (
    <HashRouter>
      <Suspense
        fallback={
          <div className="pt-3 text-center">
            <CSpinner color="primary" variant="grow" />
          </div>
        }
      >
        <Routes>
          <Route exact path="/" element={<Login />} />
          <Route exact path="/register" name="Register Page" element={<Register />} />
          <Route exact path="/404" name="Page 404" element={<Page404 />} />
          <Route exact path="/500" name="Page 500" element={<Page500 />} />
          <Route
            exact
            path="/hr"
            name="HR"
            element={
              <ProtectedRoute>
                <HR />
              </ProtectedRoute>
            }
          />
          <Route
            exact
            path="/cp"
            name="Change Password"
            element={
              <ProtectedRoute>
                <CP />
              </ProtectedRoute>
            }
          />
          <Route
            exact
            path="/employee"
            name="Employee"
            element={
              <ProtectedRoute>
                <EMPLOYEE />
              </ProtectedRoute>
            }
          />
          <Route
            exact
            path="/emp"
            name="Employee Management"
            element={
              <ProtectedRoute>
                <Emp />
              </ProtectedRoute>
            }
          />
          <Route
            exact
            path="/payslip"
            name="Payslip"
            element={
              <ProtectedRoute>
                <Payslip />
              </ProtectedRoute>
            }
          />
          <Route
            exact
            path="/generate"
            name="Generate Payslip"
            element={
              <ProtectedRoute>
                <Generate />
              </ProtectedRoute>
            }
          />
          <Route
            exact
            path="/generated"
            name="Generated Payslip"
            element={
              <ProtectedRoute>
                <Generated />
              </ProtectedRoute>
            }
          />
          <Route
            exact
            path="/viewpayslip"
            name="View Payslip"
            element={
              <ProtectedRoute>
                <ViewPayslip />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            name="Home"
            element={
              <ProtectedRoute>
                <DefaultLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

export default App
