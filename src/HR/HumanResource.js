import React, { useState, useEffect } from 'react'
import { Button, Modal, Form } from 'react-bootstrap'
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa'

const getToken = () => localStorage.getItem('jwt_token')
function HumanResource({ onEdit = () => {}, onDelete = () => {} }) {
  const [tableData, setTableData] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [newEntry, setNewEntry] = useState({ username: '', email: '', password: '' })
  const [editIndex, setEditIndex] = useState(null)

  useEffect(() => {
    fetchAllHrUsers().then((res) => {
      if (res.users) {
        setTableData(
          res.users.map((u) => ({
            id: u.id,
            username: u.username,
            email: u.email,
          })),
        )
      }
    })
  }, [])

  const handleShow = () => {
    setNewEntry({ username: '', email: '', password: '' })
    setEditIndex(null)
    setShowModal(true)
  }

  const handleEdit = (index) => {
    setNewEntry({ ...tableData[index], password: '' }) // Password not editable
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
    setNewEntry({ ...newEntry, [name]: value })
  }

  const handleSave = async () => {
    if (newEntry.username && newEntry.email) {
      if (editIndex !== null) {
        // 🛠 Update user
        const updated = { ...newEntry, id: tableData[editIndex].id }
        await updateHrUser(updated)
        const updatedData = [...tableData]
        updatedData[editIndex] = updated
        setTableData(updatedData)
        onEdit(editIndex, updated)
      } else {
        // ➕ Create new user
        const res = await createHrUser(newEntry)
        if (res.message?.includes('success')) {
          const refreshed = await fetchAllHrUsers()
          setTableData(
            refreshed.users.map((u) => ({
              id: u.id,
              username: u.username,
              email: u.email,
            })),
          )
        }
      }
      handleClose()
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Human Resource Table</h5>
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
                placeholder="Enter username"
                value={newEntry.username}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                placeholder="Enter email"
                value={newEntry.email}
                onChange={handleChange}
              />
            </Form.Group>
            {editIndex === null && (
              <Form.Group>
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  value={newEntry.password}
                  onChange={handleChange}
                />
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSave}>
            {editIndex !== null ? 'Update' : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>

      <table className="table table-bordered table-striped text-center">
        <thead>
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
              <tr key={index}>
                <td>{row.username}</td>
                <td>{row.email}</td>
                <td>
                  <div className="d-flex justify-content-center gap-2">
                    <Button variant="warning" size="sm" onClick={() => handleEdit(index)}>
                      <FaEdit />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        const id = tableData[index].id
                        deleteHrUser(id).then(() => {
                          setTableData((prev) => prev.filter((_, i) => i !== index))
                          onDelete(index)
                        })
                      }}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  )
}

export default HumanResource

// 🔧 API FUNCTIONS
const fetchAllHrUsers = async () => {
  const JWT_TOKEN = getToken()
  const response = await fetch('https://piquota.com/payslip-apis/read_hr.php', {
    headers: {
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
  })
  return await response.json()
}

const createHrUser = async (data) => {
  const JWT_TOKEN = getToken()
  return await fetch('https://piquota.com/payslip-apis/create_hr.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
    body: JSON.stringify(data),
  }).then((res) => res.json())
}

const updateHrUser = async (data) => {
  const JWT_TOKEN = getToken()
  return await fetch('https://piquota.com/payslip-apis/update_hr.php', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
    body: JSON.stringify(data),
  }).then((res) => res.json())
}

const deleteHrUser = async (id) => {
  const JWT_TOKEN = getToken()
  return await fetch('https://piquota.com/payslip-apis/delete_hr.php', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
    body: JSON.stringify({ id }),
  }).then((res) => res.json())
}
