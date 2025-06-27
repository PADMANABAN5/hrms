import React, { useState, useEffect } from 'react'
import { Button, Modal, Form } from 'react-bootstrap'
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa'
import { AppHeader, AppSidebar } from '../../../components/index'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const getToken = () => localStorage.getItem('jwt_token')
function Generate() {
  const [tableData, setTableData] = useState([])
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()
  const [newEntry, setNewEntry] = useState({
    employee_id: '',
    name: '',
    email: '',
  })
  const [editIndex, setEditIndex] = useState(null)

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('https://piquota.com/payslip-apis/read_employee.php', {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      })

      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.employees)
          ? res.data.employees
          : []

      setTableData(data)
    } catch (err) {
      console.error(' Failed to fetch employees:', err.response?.data || err.message)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const handleShow = () => {
    navigate('/employee') // Redirects to add employee page
  }

  const handleEdit = (index) => {
    const employee = tableData[index]
    navigate('/employee', { state: { employee } }) // Redirect and pass employee data
  }

  const handleClose = () => {
    setNewEntry({ employee_id: '', name: '', email: '' })
    setEditIndex(null)
    setShowModal(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setNewEntry((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      if (editIndex !== null) {
        // Update existing employee
        await axios.put('https://piquota.com/payslip-apis/update_employee.php', newEntry, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
        })
        alert(' Employee updated!')
      }

      await fetchEmployees()
      handleClose()
    } catch (err) {
      console.error(' Error saving employee:', err.response?.data || err.message)
      alert('Failed to update employee.')
    }
  }

  const handleDelete = async (index) => {
    const employee_id = tableData[index].employee_id
    if (!window.confirm(`Are you sure you want to delete employee ${employee_id}?`)) return

    try {
      await axios.delete('https://piquota.com/payslip-apis/delete_employee.php', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        data: { employee_id },
      })
      alert(' Employee deleted!')
      await fetchEmployees()
    } catch (err) {
      console.error(' Error deleting employee:', err.response?.data || err.message)
      alert('Failed to delete employee.')
    }
  }
  const goToGeneratePayslip = (employee) => {
    navigate('/payslip', { state: { employee } })
  }

  return (
    <div>
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div className="container mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 style={{ textAlign: 'center' }}>Payslip Generation</h5>
          </div>

          <Modal show={showModal} onHide={handleClose}>
            <Modal.Header closeButton>
              <Modal.Title>{editIndex !== null ? 'Edit Employee' : 'Add Employee'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Employee ID</Form.Label>
                  <Form.Control
                    type="text"
                    name="employee_id"
                    value={newEntry.employee_id}
                    onChange={handleChange}
                    placeholder="Enter Employee ID"
                    disabled={editIndex !== null}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Employee Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={newEntry.name}
                    onChange={handleChange}
                    placeholder="Enter Employee Name"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={newEntry.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                  />
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="success"
                onClick={handleSave}
                disabled={!newEntry.employee_id || !newEntry.name || !newEntry.email}
              >
                {editIndex !== null ? 'Update' : 'Save'}
              </Button>
            </Modal.Footer>
          </Modal>

          <table className="table table-bordered table-striped text-center">
            <thead className="table-primary">
              <tr>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Email</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(tableData) && tableData.length > 0 ? (
                tableData.map((row, index) => (
                  <tr key={row.employee_id}>
                    <td>{row.employee_id}</td>
                    <td>{row.name}</td>
                    <td>{row.email}</td>
                    <td>
                      <div className="d-flex justify-content-center gap-2">
                        <Button variant="info" size="sm" onClick={() => goToGeneratePayslip(row)}>
                          Generate Payslip
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Generate
