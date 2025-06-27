import React, { useState, useEffect } from 'react'
import { Button, Modal, Form } from 'react-bootstrap'
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa'
import { AppHeader, AppSidebar } from '../../../components/index'
import axios from 'axios'

const getToken = () => localStorage.getItem('jwt_token')

function HumanResource({ onEdit = () => {}, onDelete = () => {} }) {
  const [tableData, setTableData] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [newEntry, setNewEntry] = useState({ username: '', email: '', password: '' })
  const [editIndex, setEditIndex] = useState(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const res = await fetchAllHrUsers()
      if (res?.users) {
        setTableData(
          res.users.map((u) => ({
            id: u.id,
            username: u.username,
            email: u.email,
          })),
        )
      }
    } catch (error) {
      console.error('Failed to fetch HR users:', error)
    }
  }

  const handleShow = () => {
    setNewEntry({ username: '', email: '', password: '' })
    setEditIndex(null)
    setShowModal(true)
  }

  const handleEdit = (index) => {
    setNewEntry({ ...tableData[index], password: '' }) // keep password empty initially
    setEditIndex(index)
    setShowModal(true)
  }

  const handleClose = () => {
    setNewEntry({ username: '', email: '', password: '' })
    setEditIndex(null)
    setShowModal(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setNewEntry((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    const { username, email, password } = newEntry
    if (!username || !email || (!password && editIndex === null)) return

    try {
      if (editIndex !== null) {
        const updated = {
          id: tableData[editIndex].id,
          username,
          email,
          password,
        }
        const res = await updateHrUser(updated)
        if (res.message?.includes('success')) {
          const updatedData = [...tableData]
          updatedData[editIndex] = { ...updated, password: '' }
          setTableData(updatedData)
          onEdit(editIndex, updated)
        }
      } else {
        const res = await createHrUser({ username, email, password })
        if (res.message?.includes('success')) {
          await loadUsers()
        }
      }
      handleClose()
    } catch (error) {
      console.error('Save failed:', error)
    }
  }

  const handleDelete = async (index) => {
    const id = tableData[index].id
    try {
      const res = await deleteHrUser(id)
      if (res.message?.includes('success')) {
        setTableData((prev) => prev.filter((_, i) => i !== index))
        onDelete(index)
      }
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  return (
    <div>
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div className="container mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 style={{ textAlign: 'center' }}>Human Resource Table</h5>
            <Button variant="primary" onClick={handleShow}>
              <FaPlus />
            </Button>
          </div>

          <Modal show={showModal} onHide={handleClose}>
            <Modal.Header closeButton>
              <Modal.Title>{editIndex !== null ? 'Edit User' : 'Add User'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={newEntry.username}
                    onChange={handleChange}
                    placeholder="Enter username"
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
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={newEntry.password}
                    onChange={handleChange}
                    placeholder={
                      editIndex !== null
                        ? 'Enter new password (leave blank to keep old)'
                        : 'Enter password'
                    }
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
                disabled={
                  !newEntry.username ||
                  !newEntry.email ||
                  (editIndex === null && !newEntry.password)
                }
              >
                {editIndex !== null ? 'Update' : 'Save'}
              </Button>
            </Modal.Footer>
          </Modal>

          <table className="table table-bordered table-striped text-center">
            <thead className="table-primary">
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan="3">No data available</td>
                </tr>
              ) : (
                tableData.map((row, index) => (
                  <tr key={row.id}>
                    <td>{row.username}</td>
                    <td>{row.email}</td>
                    <td>
                      <div className="d-flex justify-content-center gap-2">
                        <Button variant="warning" size="sm" onClick={() => handleEdit(index)}>
                          <FaEdit />
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(index)}>
                          <FaTrash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// 📦 API Calls with Axios

const axiosInstance = axios.create({
  baseURL: 'https://piquota.com/payslip-apis',
  headers: {
    'Content-Type': 'application/json',
  },
})

const fetchAllHrUsers = async () => {
  try {
    const JWT_TOKEN = getToken()
    if (!JWT_TOKEN) {
      console.error('JWT token is missing!')
      return
    }

    const response = await axios.get('https://piquota.com/payslip-apis/read_hr.php', {
      headers: {
        Authorization: `Bearer ${JWT_TOKEN}`,
      },
    })

    return response.data
  } catch (err) {
    console.error('Failed to fetch HR users:', err)
    return null
  }
}

const createHrUser = async (data) => {
  const JWT_TOKEN = getToken()
  const response = await axiosInstance.post('/create_hr.php', data, {
    headers: { Authorization: `Bearer ${JWT_TOKEN}` },
  })
  return response.data
}

const updateHrUser = async (data) => {
  const JWT_TOKEN = getToken()
  const response = await axiosInstance.put('/update_hr.php', data, {
    headers: { Authorization: `Bearer ${JWT_TOKEN}` },
  })
  return response.data
}

const deleteHrUser = async (id) => {
  const JWT_TOKEN = getToken()
  const response = await axiosInstance.delete('/delete_hr.php', {
    headers: { Authorization: `Bearer ${JWT_TOKEN}` },
    data: { id },
  })
  return response.data
}

export default HumanResource
