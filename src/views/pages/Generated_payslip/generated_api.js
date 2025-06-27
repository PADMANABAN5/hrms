import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppHeader, AppSidebar } from '../../../components/index'
import axios from 'axios'

const getToken = () => localStorage.getItem('jwt_token')

function GeneratedApi() {
  const [payslips, setPayslips] = useState([])
  const navigate = useNavigate()

  const fetchPayslips = async () => {
    try {
      const res = await axios.get('https://piquota.com/payslip-apis/read_payslip.php', {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      })

      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.payslips)
          ? res.data.payslips
          : []

      setPayslips(data)
    } catch (error) {
      console.error('Error fetching payslips:', error.response?.data || error.message)
    }
  }

  const handleViewPayslip = (payslip_id) => {
    navigate('/viewpayslip', {
      state: { payslip_id },
    })
  }

  useEffect(() => {
    fetchPayslips()
  }, [])

  return (
    <div>
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div className="container mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 style={{ textAlign: 'center' }}>Generated Payslips</h5>
          </div>

          <table className="table table-bordered table-striped text-center">
            <thead className="table-primary">
              <tr>
                <th>Payslip ID</th>
                <th>Month</th>
                <th>Year</th>
                <th>Emp ID</th>
                <th>Emp Name</th>
                <th>Total Payable</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payslips.length > 0 ? (
                payslips.map((payslip) => (
                  <tr key={payslip.payslip_id}>
                    <td>{payslip.payslip_id}</td>
                    <td>{payslip.month}</td>
                    <td>{payslip.year}</td>
                    <td>{payslip.employee_id}</td>
                    <td>{payslip.employee_name}</td>
                    <td>
                      {payslip.total_payable
                        ? parseFloat(payslip.total_payable).toFixed(2)
                        : '0.00'}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleViewPayslip(payslip.payslip_id)}
                      >
                        View Payslip
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-4 text-muted">
                    No payslips found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default GeneratedApi
