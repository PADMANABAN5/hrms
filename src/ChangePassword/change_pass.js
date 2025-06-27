import React, { useState } from 'react'
import { Button, Card, Col, Container, Form, Row, Modal } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { AppHeader, AppSidebar } from '../../src/components/index'
import axios from 'axios'
function ChangePass() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (newPassword !== repeatPassword) {
      alert('New password does not match, Please check again.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('jwt_token')
      const res = await axios.post(
        'https://piquota.com/payslip-apis/change_password.php',
        {
          current_password: currentPassword.trim(),
          new_password: newPassword.trim(),
          repeat_password: repeatPassword.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      )
      if (res.data?.message === 'Password changed successfully') {
        setShowModal(true)
      } else {
        setError(res.data?.message || 'Failed to change password')
      }
    } catch (err) {
      setError('Failed to change password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setShowModal(false)
    navigate('/')
  }

  return (
    <div className="d-flex">
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100 w-100">
        <AppHeader />
        <Container className="my-5">
          <Row className="justify-content-center">
            <Col md={6}>
              <Card className="shadow-sm">
                <Card.Body>
                  <h3 className="text-center mb-4">Change Password</h3>
                  <Form onSubmit={handleSubmit}>
                    <Form.Group controlId="formCurrentPassword" className="mb-3">
                      <Form.Label>Current Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Form.Group controlId="formNewPassword" className="mb-3">
                      <Form.Label>New Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Form.Group controlId="formRepeatPassword" className="mb-4">
                      <Form.Label>Repeat New Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Repeat new password"
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                      {loading ? 'Changing...' : 'Change Password'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
        {error && <div className="text-danger text-center my-2">{error}</div>}

        <Modal show={showModal} onHide={handleClose} backdrop="static" keyboard={false} centered>
          <Modal.Header closeButton>
            <Modal.Title>Password Changed</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            You have successfully changed your password. Please login with your new password.
          </Modal.Body>
          <Modal.Footer>
            <Button variant="success" onClick={handleClose}>
              OK
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  )
}

export default ChangePass
