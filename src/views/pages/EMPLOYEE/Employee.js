import React, { useState, useEffect } from 'react'
import { AppHeader, AppSidebar } from '../../../components/index'
import './Employee.css'
import { Button } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { FaArrowLeft } from 'react-icons/fa'
import axios from 'axios'
import { useLocation } from 'react-router-dom'

const getToken = () => localStorage.getItem('jwt_token')

function Employee() {
  const navigate = useNavigate()
  const location = useLocation()
  const editingEmployee = location.state?.employee

  const [earnings, setEarnings] = useState({
    basic: 0,
    hra: 0,
    special: 0,
    adhoc: 0,
    food: 0,
    communication: 0,
    internet: 0,
  })

  const [form, setForm] = useState({
    employee_id: '',
    status: '',
    name: '',
    email: '',
    phone_number: '',
    designation: '',
    date_of_joining: '',
    pf_number: '',
    pan: '',
    bank_name: '',
    ifsc: '',
    account_number: '',
    pf_deduction: 0,
    pt_deduction: 0,
    tds_deduction: 0,
    insurance_deduction: 0,
    lwf_deduction: 0,
    esi_deduction: 0,
    vpf_deduction: 0,
  })

  const handleEarningsChange = (e) => {
    const { name, value } = e.target
    setEarnings((prev) => ({
      ...prev,
      [name]: value === '' ? '' : Number(value),
    }))
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const grossAllowances = Object.values(earnings).reduce((sum, val) => sum + val, 0)

  const handledirect = () => {
    navigate('/emp')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = {
      ...form,
      basic: earnings.basic,
      hra: earnings.hra,
      special_allowance: earnings.special,
      adhoc: earnings.adhoc,
      food_allowance: earnings.food,
      communication_allowance: earnings.communication,
      internet_allowance: earnings.internet,
      gross_salary: grossAllowances,
    }

    try {
      const url = editingEmployee
        ? 'https://piquota.com/payslip-apis/update_employee.php'
        : 'https://piquota.com/payslip-apis/create_employee.php'

      await axios({
        method: editingEmployee ? 'put' : 'post',
        url,
        data: formData,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
      })

      alert(`Employee ${editingEmployee ? 'updated' : 'created'} successfully!`)
      navigate('/emp')
    } catch (err) {
      console.error('Error:', err.response?.data || err.message)
      alert('Error saving employee data')
    }
  }
  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      if (!editingEmployee?.employee_id) return

      try {
        const res = await axios.get('https://piquota.com/payslip-apis/read_employee.php', {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        })

        const employees = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.employees)
            ? res.data.employees
            : []

        const emp = employees.find((e) => e.employee_id === editingEmployee.employee_id)
        if (emp) {
          setForm(emp)
          setEarnings({
            basic: Number(emp.basic || 0),
            hra: Number(emp.hra || 0),
            special: Number(emp.special_allowance || 0),
            adhoc: Number(emp.adhoc || 0),
            food: Number(emp.food_allowance || 0),
            communication: Number(emp.communication_allowance || 0),
            internet: Number(emp.internet_allowance || 0),
            bonus: Number(emp.bonus || 0),
          })
        }
      } catch (err) {
        console.error('Failed to fetch employees:', err.response?.data || err.message)
      }
    }

    fetchEmployeeDetails()
  }, [editingEmployee])

  const handleNumberKeyDown = (e) => {
    // Prevent up and down arrow keys
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
    }
  }
  const handleNumberWheel = (e) => {
    e.target.blur()
  }
  return (
    <div>
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <form className="container mt-4" onSubmit={handleSubmit}>
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
            >
              Basic Details
            </legend>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Employee ID :</label>
                  <input
                    type="text"
                    name="employee_id"
                    className="form-control"
                    placeholder="Enter Employee ID"
                    value={form.employee_id}
                    onChange={handleFormChange}
                    disabled={!!editingEmployee} // 👈 This disables it in edit mode
                  />
                </div>
                {[
                  { label: 'Name', name: 'name' },
                  { label: 'Email', name: 'email', type: 'email' },
                  { label: 'Phone Number', name: 'phone_number', type: 'tel' },
                  { label: 'Designation', name: 'designation' },
                ].map(({ label, name, type = 'text' }) => (
                  <div className="mb-3" key={name}>
                    <label className="form-label">{label} :</label>
                    <input
                      type={type}
                      name={name}
                      className="form-control"
                      placeholder={`Enter ${label}`}
                      value={form[name]}
                      onChange={handleFormChange}
                    />
                  </div>
                ))}

                <div className="mb-3">
                  <label className="form-label">Status :</label>
                  <select
                    className="form-select"
                    name="status"
                    value={form.status}
                    onChange={handleFormChange}
                  >
                    <option value="" disabled>
                      Select status
                    </option>
                    <option>Active</option>
                    <option>Inactive</option>
                    <option>Terminated</option>
                  </select>
                </div>
              </div>

              <div className="col-md-6">
                {[
                  { label: 'Date of Joining', name: 'date_of_joining', type: 'date' },
                  { label: 'PF Number', name: 'pf_number' },
                  { label: 'PAN Number', name: 'pan' },
                  { label: 'Bank Name', name: 'bank_name' },
                  { label: 'IFSC', name: 'ifsc' },
                  { label: 'Account Number', name: 'account_number' },
                ].map(({ label, name, type = 'text' }) => (
                  <div className="mb-3" key={name}>
                    <label className="form-label">{label} :</label>
                    <input
                      type={type}
                      name={name}
                      className="form-control"
                      placeholder={`Enter ${label}`}
                      value={form[name]}
                      onChange={handleFormChange}
                    />
                  </div>
                ))}
              </div>
            </div>
          </fieldset>

          <fieldset className="border p-4 rounded mt-4">
            <legend
              className="w-auto px-4 py-2 text-lg font-semibold shadow-sm tittle2"
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
                <h3 className="mt-1 tittle3">Earnings</h3>

                {[
                  { label: 'Basic Salary', name: 'basic' },
                  { label: 'HRA', name: 'hra' },
                  { label: 'Special Allowances', name: 'special' },
                  { label: 'ADHOC', name: 'adhoc' },
                  { label: 'Food Allowance', name: 'food' },
                  { label: 'Communication Allowance', name: 'communication' },
                  { label: 'Internet Allowances', name: 'internet' },
                ].map(({ label, name }) => (
                  <div className="mb-3" key={name}>
                    <label className="form-label">{label} :</label>
                    <input
                      type="number"
                      name={name}
                      min="0"
                      className="form-control"
                      placeholder={`Enter ${label}`}
                      value={earnings[name]}
                      onChange={handleEarningsChange}
                      onKeyDown={handleNumberKeyDown}
                      onWheel={handleNumberWheel}
                    />
                  </div>
                ))}

                <div className="mb-3">
                  <label className="form-label">Gross Salary :</label>
                  <input type="number" className="form-control" value={grossAllowances} readOnly />
                </div>
              </div>

              <div className="col-md-6">
                <h3 className="mt-1 title4">Deductions</h3>
                {[
                  { label: 'PF', name: 'pf_deduction' },
                  { label: 'PT', name: 'pt_deduction' },
                  { label: 'TDS', name: 'tds_deduction' },
                  { label: 'Insurance', name: 'insurance_deduction' },
                  { label: 'LWF', name: 'lwf_deduction' },
                  { label: 'ESI', name: 'esi_deduction' },
                  { label: 'VPF', name: 'vpf_deduction' },
                ].map(({ label, name }) => (
                  <div className="mb-3" key={name}>
                    <label className="form-label">{label} :</label>
                    <input
                      type="number"
                      name={name}
                      min="0"
                      className="form-control"
                      placeholder={`Enter ${label}`}
                      value={form[name]}
                      onChange={handleFormChange}
                      onKeyDown={handleNumberKeyDown}
                      onWheel={handleNumberWheel}
                    />
                  </div>
                ))}
              </div>
            </div>
          </fieldset>

          <div className="text-center mt-4">
            <button type="submit" className="btn btn-primary">
              {editingEmployee ? 'Update Employee' : 'Save Employee Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Employee
