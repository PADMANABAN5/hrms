import React, { useEffect, useState } from 'react'
import { AppHeader, AppSidebar } from '../../../components/index'
import '../EMPLOYEE/Employee.css'
import { Button } from 'react-bootstrap'
import { useNavigate, useLocation } from 'react-router-dom'
import { FaArrowLeft } from 'react-icons/fa'
import axios from 'axios' // Import axios

// Define getToken outside the component or in a utility file.
const getToken = () => localStorage.getItem('jwt_token')

function Payslip() {
  const navigate = useNavigate()
  const location = useLocation()
  const [employee, setEmployee] = useState(location.state?.employee || {})
  const [totalLeave, setTotalLeave] = useState(0)
  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' })
  const [selectedMonth, setSelectedMonth] = useState(currentMonthName)
  const [paidLeave, setPaidLeave] = useState(1)
  const [unpaidLeave, setUnpaidLeave] = useState(0)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [bonus, setBonus] = useState(0)
  const [otherRecovery, setOtherRecovery] = useState(0)
  const [tds, setTds] = useState(employee.tds_deduction || 0)
  const [vpf, setVpf] = useState(employee.vpf_deduction || 0)
  const [daysInSelectedMonth, setDaysInSelectedMonth] = useState(0)
  const [perDaySalary, setPerDaySalary] = useState(0)
  const [grossAllowances, setGrossAllowances] = useState(0)
  const [netPayableSalary, setNetPayableSalary] = useState(0)
  const [daysPresent, setDaysPresent] = useState(0)
  const [totalDeductions, setTotalDeductions] = useState(0)
  const [salaryHold, setSalaryHold] = useState(0)
  const [remark, setRemark] = useState('')
  const [totalPayable, setTotalPayable] = useState(0)

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const getDaysInMonth = (monthName, year) => {
    if (!monthName || !year) {
      console.warn('getDaysInMonth: monthName or year is missing', { monthName, year })
      return 0
    }
    const monthIndex = months.indexOf(monthName)
    if (monthIndex === -1) {
      console.error(`getDaysInMonth: Invalid month name provided: ${monthName}`)
      return 0
    }
    try {
      const date = new Date(year, monthIndex + 1, 0)
      return date.getDate()
    } catch (e) {
      console.error('Error calculating days in month:', e)
      return 0
    }
  }

  // Effect to fetch employee details (GET request using Axios)
  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      const employeeId = location.state?.employee?.employee_id
      if (!employeeId) return

      const token = getToken()
      if (!token) {
        console.error('JWT Token not found. Please log in or ensure the token is available.')
        navigate('/login')
        return
      }

      try {
        // Axios GET request
        const response = await axios.get(`https://piquota.com/payslip-apis/read_employee.php`, {
          params: { employee_id: employeeId }, // Query parameters handled by params
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        console.log('Fetched employee details:', response.data) // Axios puts the response body in .data

        const employeeData = response.data.employee || response.data.data?.employee || response.data
        setEmployee(employeeData)
        setBonus(parseFloat(employeeData.bonus) || 0)
        setTds(parseFloat(employeeData.tds_deduction) || 0)
        setVpf(parseFloat(employeeData.vpf_deduction) || 0)
      } catch (err) {
        console.error('Error fetching employee:', err) // Axios error object
        if (axios.isAxiosError(err)) {
          // Access error response from server
          if (err.response) {
            console.error('Response data:', err.response.data)
            console.error('Response status:', err.response.status)
            console.error('Response headers:', err.response.headers)

            if (err.response.status === 401 || err.response.status === 403) {
              console.error('Authentication error: Token expired or invalid.')
              localStorage.removeItem('jwt_token')
              navigate('/login')
            } else {
              alert(
                `Failed to fetch employee details: ${err.response.data.message || err.response.statusText || 'Unknown error'}`,
              )
            }
          } else if (err.request) {
            // The request was made but no response was received
            console.error('No response received:', err.request)
            alert('No response received from server. Please check your internet connection.')
          } else {
            // Something else happened in setting up the request
            console.error('Error in request setup:', err.message)
            alert('An unexpected error occurred. Please try again.')
          }
        } else {
          // Non-Axios error
          alert(`An unexpected error occurred: ${err.message}`)
        }
      }
    }
    fetchEmployeeDetails()
  }, [location.state?.employee?.employee_id, navigate])

  // All your existing calculation useEffects remain the same
  useEffect(() => {
    const total = parseInt(employee.total_leaves || 0, 10)
    if (!isNaN(total) && total >= 1) {
      setPaidLeave(1)
      setUnpaidLeave(total - 1)
    } else {
      setPaidLeave(0)
      setUnpaidLeave(0)
    }
  }, [employee.total_leaves])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getFullYear()
      if (now !== currentYear) {
        setCurrentYear(now)
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [currentYear])

  useEffect(() => {
    const total = parseInt(totalLeave, 10)
    if (!isNaN(total) && total >= 1) {
      setPaidLeave(1)
      setUnpaidLeave(total - 1)
    } else {
      setPaidLeave(0)
      setUnpaidLeave(0)
    }
  }, [totalLeave])

  useEffect(() => {
    if (selectedMonth && currentYear) {
      const calculatedDays = getDaysInMonth(selectedMonth, currentYear)
      setDaysInSelectedMonth(calculatedDays)
    } else {
      setDaysInSelectedMonth(0)
    }
  }, [selectedMonth, currentYear])

  useEffect(() => {
    if (daysInSelectedMonth > 0) {
      const calculatedDaysPresent = daysInSelectedMonth - (parseInt(totalLeave, 10) || 0)
      setDaysPresent(calculatedDaysPresent > 0 ? calculatedDaysPresent : 0)
    } else {
      setDaysPresent(0)
    }
  }, [daysInSelectedMonth, totalLeave])

  useEffect(() => {
    const calculatedGross = [
      +employee.basic,
      +employee.hra,
      +employee.special_allowance,
      +employee.adhoc,
      +employee.food_allowance,
      +employee.communication_allowance,
      +employee.internet_allowance,
    ].reduce((sum, val) => sum + (isNaN(val) ? 0 : val), 0)
    setGrossAllowances(calculatedGross)
  }, [
    employee.basic,
    employee.hra,
    employee.special_allowance,
    employee.adhoc,
    employee.food_allowance,
    employee.communication_allowance,
    employee.internet_allowance,
  ])

  useEffect(() => {
    if (grossAllowances > 0 && daysInSelectedMonth > 0) {
      const calculatedPerDaySalary = grossAllowances / daysInSelectedMonth
      setPerDaySalary(calculatedPerDaySalary.toFixed(2))
    } else {
      setPerDaySalary(0)
    }
  }, [grossAllowances, daysInSelectedMonth])

  useEffect(() => {
    const deduction = perDaySalary * unpaidLeave
    setOtherRecovery(deduction)
  }, [perDaySalary, unpaidLeave])

  useEffect(() => {
    const calculatedTotalDeductions =
      (isNaN(+employee.pf_deduction) ? 0 : +employee.pf_deduction) +
      (isNaN(+employee.pt_deduction) ? 0 : +employee.pt_deduction) +
      (isNaN(+tds) ? 0 : +tds) +
      (isNaN(+employee.insurance_deduction) ? 0 : +employee.insurance_deduction) +
      (isNaN(+employee.lwf_deduction) ? 0 : +employee.lwf_deduction) +
      (isNaN(+employee.esi_deduction) ? 0 : +employee.esi_deduction) +
      (isNaN(+vpf) ? 0 : +vpf) +
      (isNaN(+otherRecovery) ? 0 : +otherRecovery)

    setTotalDeductions(calculatedTotalDeductions)

    const netPayable = grossAllowances - calculatedTotalDeductions
    setNetPayableSalary(netPayable)
  }, [
    grossAllowances,
    otherRecovery,
    employee.pf_deduction,
    employee.pt_deduction,
    tds,
    employee.insurance_deduction,
    employee.lwf_deduction,
    employee.esi_deduction,
    vpf,
  ])

  useEffect(() => {
    const salaryHoldAmount = parseFloat(salaryHold) || 0
    const bonusAmount = parseFloat(bonus) || 0
    const calculatedTotalPayable =
      grossAllowances - totalDeductions + bonusAmount - salaryHoldAmount
    setTotalPayable(calculatedTotalPayable > 0 ? calculatedTotalPayable : 0)
  }, [grossAllowances, totalDeductions, bonus, salaryHold])

  // Modified function to handle Payslip creation (POST API call using Axios)
  const handleGeneratePayslip = async () => {
    const token = getToken()
    if (!token) {
      alert('Authentication required. Please log in again.')
      navigate('/login')
      return
    }

    if (!employee.employee_id || !selectedMonth || !currentYear) {
      alert('Employee ID, Month, and Year are required to generate a payslip.')
      return
    }

    const payslipData = {
      employee_id: employee.employee_id,
      month: selectedMonth,
      year: currentYear,
      days_in_month: daysInSelectedMonth,
      days_present: daysPresent,
      total_leaves: parseInt(totalLeave, 10) || 0,
      paid_leaves: paidLeave,
      unpaid_leaves: unpaidLeave,
      basic: parseFloat(employee.basic) || 0,
      hra: parseFloat(employee.hra) || 0,
      special_allowance: parseFloat(employee.special_allowance) || 0,
      adhoc: parseFloat(employee.adhoc) || 0,
      food_allowance: parseFloat(employee.food_allowance) || 0,
      communication_allowance: parseFloat(employee.communication_allowance) || 0,
      internet_allowance: parseFloat(employee.internet_allowance) || 0,
      pf_deduction: parseFloat(employee.pf_deduction) || 0,
      pt_deduction: parseFloat(employee.pt_deduction) || 0,
      tds_deduction: parseFloat(tds) || 0,
      insurance_deduction: parseFloat(employee.insurance_deduction) || 0,
      lwf_deduction: parseFloat(employee.lwf_deduction) || 0,
      esi_deduction: parseFloat(employee.esi_deduction) || 0,
      vpf_deduction: parseFloat(vpf) || 0,
      other_recovery: parseFloat(otherRecovery) || 0,
      salary_hold: parseFloat(salaryHold) || 0,
      gross_salary: parseFloat(grossAllowances) || 0,
      total_deduction: parseFloat(totalDeductions) || 0,
      total_payable: parseFloat(totalPayable) || 0,
      remark: remark,
    }

    console.log('Sending Payslip Data:', payslipData)

    try {
      const response = await axios.post(
        'https://piquota.com/payslip-apis/create_payslip.php',
        payslipData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      )

      // Check if response.data exists, otherwise use a generic success message
      const successMessage = response.data?.message || 'Payslip generated successfully!'
      alert(successMessage)
      console.log('Payslip creation successful, response:', response.data)
      // Optionally, navigate or clear form
    } catch (err) {
      console.error('Error creating payslip:', err) // Axios error object
      if (axios.isAxiosError(err)) {
        if (err.response) {
          console.error('Response data:', err.response.data)
          console.error('Response status:', err.response.status)
          console.error('Response headers:', err.response.headers)

          // --- MODIFIED LOGIC START ---
          if (err.response.data?.message === 'Payslip already generated for this employee ID.') {
            alert('Payslip is already generated for this employee ID.')
            return
          } else if (err.response.status === 409) {
            alert('Payslip is already generated for this employee ID.')
            return
          } else if (err.response.status === 400) {
            alert('Missing Total deduction')
            return // Exit after handling bad request error
          } else if (err.response.status === 401 || err.response.status === 403) {
            console.error('Authentication error: Token expired or invalid.')
            localStorage.removeItem('jwt_token')
            navigate('/login')
            return // Exit after handling authentication error
          }
          // If none of the above specific errors, show a generic server error
          alert(
            `Failed to generate payslip: ${err.response.data?.message || err.response.statusText || 'Unknown server error'}`,
          )
          // --- MODIFIED LOGIC END ---
        } else if (err.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an http.ClientRequest in node.js
          console.error('No response received:', err.request)
          alert('No response received from server. Please check your internet connection.')
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Error in request setup:', err.message)
          alert('An unexpected error occurred while preparing the request. Please try again.')
        }
      } else {
        // Non-Axios error (e.g., a JavaScript error before the request was even sent)
        alert(`An unexpected error occurred: ${err.message}`)
      }
    }
  }

  const handledirect = () => navigate('/emp')

  const handleNumberKeyDown = (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
    }
  }

  const handleNumberWheel = (e) => {
    e.target.blur()
  }
  const handleSafeNumberInput = (setter) => (e) => {
    const value = Math.max(0, +e.target.value)
    setter(value)
  }
  const renderField = (label, value, isEditable = false, onChange = () => {}) => (
    <div className="row mb-2 align-items-center">
      <div className="col-sm-5">
        <label className="form-label mb-0">{label}:</label>
      </div>
      <div className="col-sm-7">
        {isEditable ? (
          <input
            type="number"
            className="form-control"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <p className="form-control-static mb-0">{value || '-'}</p>
        )}
      </div>
    </div>
  )

  return (
    <div>
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div className="container mt-4">
          <Button variant="primary" className="mb-3" onClick={handledirect}>
            <FaArrowLeft />
          </Button>

          <fieldset className="border p-4 rounded">
            <legend
              className="w-auto px-3"
              style={{
                fontSize: '30px',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '10px',
                marginLeft: '33%',
              }}
            ></legend>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Select Month:</label>
                  <select
                    className="form-select"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    {!months.includes(selectedMonth) && (
                      <option value="" disabled>
                        Select month
                      </option>
                    )}
                    {months.map((month, index) => (
                      <option key={index} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Total Leaves:</label>
                  <input
                    className="form-control"
                    type="number"
                    value={totalLeave}
                    onChange={(e) => setTotalLeave(e.target.value)}
                    min="0"
                    onKeyDown={handleNumberKeyDown}
                    onWheel={handleNumberWheel}
                  />
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Paid Leaves:</label>
                    <input type="number" className="form-control" value={paidLeave} readOnly />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Unpaid Leaves:</label>
                    <input type="number" className="form-control" value={unpaidLeave} readOnly />
                  </div>
                  <div className="mt-3">{renderField('Days in Month', daysInSelectedMonth)}</div>
                  <div className="mt-3">{renderField('Days Present', daysPresent)}</div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Year:</label>
                  <input
                    id="year"
                    className="form-control"
                    type="text"
                    value={currentYear}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset className="border p-4 rounded mt-4">
            <legend
              className="w-auto px-3"
              style={{
                fontSize: '30px',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '10px',
                marginLeft: '33%',
              }}
            >
              Basic Details
            </legend>
            <div className="row">
              <div className="col-md-6">
                {renderField('Employee ID', employee.employee_id)}
                {renderField('Name', employee.name)}
                {renderField('Email', employee.email)}
                {renderField('Phone Number', employee.phone_number)}
                {renderField('Designation', employee.designation)}
                {renderField('Status', employee.status)}
              </div>
              <div className="col-md-6">
                {renderField('Date of Joining', employee.date_of_joining)}
                {renderField('PF Number', employee.pf_number)}
                {renderField('PAN Number', employee.pan)}
                {renderField('Bank Name', employee.bank_name)}
                {renderField('IFSC', employee.ifsc)}
                {renderField('Account Number', employee.account_number)}
              </div>
            </div>
          </fieldset>

          <fieldset className="border p-4 rounded mt-4">
            <legend
              className="w-auto px-3"
              style={{
                fontSize: '30px',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '10px',
                marginLeft: '33%',
              }}
            >
              Salary Details
            </legend>
            <div className="row">
              <div className="col-md-6">
                <h5 className="mt-1">Earnings</h5>
                {renderField('Basic Salary', employee.basic)}
                {renderField('HRA', employee.hra)}
                {renderField('Special Allowances', employee.special_allowance)}
                {renderField('ADHOC', employee.adhoc)}
                {renderField('Food Allowance', employee.food_allowance)}
                {renderField('Communication Allowance', employee.communication_allowance)}
                {renderField('Internet Allowances', employee.internet_allowance)}
                {renderField('Gross Salary', grossAllowances)}
              </div>
              <div className="col-md-6">
                <h5 className="mt-1">Deductions</h5>
                {renderField('PF', employee.pf_deduction)}
                {renderField('PT', employee.pt_deduction)}
                {renderField('TDS', tds, true, setTds, {
                  onWheel: handleNumberWheel,
                  onKeyDown: handleNumberKeyDown,
                })}
                {renderField('Insurance', employee.insurance_deduction)}
                {renderField('LWF', employee.lwf_deduction)}
                {renderField('ESI', employee.esi_deduction)}
                {renderField('VPF', vpf, true, setVpf)}
                {renderField('Other Recovery', otherRecovery, true, setOtherRecovery)}
                {renderField('Total Deductions', totalDeductions)}
              </div>
            </div>
            <hr></hr>
            <div className="col-md-6">
              <div>{renderField('Bonus', bonus, true, setBonus)}</div>
              {renderField('Total Deductions', totalDeductions)}

              <div className="row mb-2 align-items-center">
                <div className="col-sm-5">
                  <label className="form-label mb-0">Salary Hold:</label>
                </div>
                <div className="col-sm-7">
                  <input
                    type="number"
                    className="form-control"
                    value={salaryHold}
                    onChange={(e) => setSalaryHold(e.target.value)}
                    min="0"
                    onKeyDown={handleNumberKeyDown}
                    onWheel={handleNumberWheel}
                  />
                </div>
              </div>
              {renderField('Total Payable', totalPayable)}
              <div className="row mb-2 align-items-center">
                <div className="col-sm-5">
                  <label className="form-label mb-0">Remark:</label>
                </div>
                <div className="col-sm-7">
                  <textarea
                    className="form-control"
                    rows="3"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Add any remarks here..."
                  ></textarea>
                </div>
              </div>
            </div>
          </fieldset>
          <Button
            variant="primary"
            style={{ marginTop: '20px', alignItems: 'center' }}
            onClick={handleGeneratePayslip}
          >
            Generate Payslip
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Payslip
