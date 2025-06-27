import React, { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
// Assuming AppHeader and AppSidebar are correctly imported from your components path
import { AppHeader, AppSidebar } from '../../../components'
// Assuming companyLogo is correctly imported
import companyLogo from '../../../assets/images/images (4).png'
// Assuming Viewpayslip.css provides necessary styles
import './Viewpayslip.css'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// --- Font Awesome Imports ---
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faPaperPlane } from '@fortawesome/free-solid-svg-icons' // The specific download icon

// Function to retrieve the JWT token from localStorage
const getToken = () => localStorage.getItem('jwt_token')

// Generic Message Modal Component to replace alert()
const MessageModal = ({ show, title, message, onClose }) => {
  if (!show) return null

  return (
    <div
      className="modal"
      style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
      tabIndex="-1"
      role="dialog"
      aria-labelledby="messageModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="messageModalLabel">
              {title}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p>{message}</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ViewPayslip() {
  // React Router hooks for location state and navigation
  const { state } = useLocation()
  const navigate = useNavigate()

  // State variables for payslip data, UI control, and email sending status
  const [payslip, setPayslip] = useState(null)
  // Ref for the payslip content div, used by html2canvas
  const payslipRef = useRef()

  // State for email recipient and subject, pre-filled from payslip data
  const [recipientEmail, setRecipientEmail] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  // State to manage loading during email sending
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  // State for displaying success/error messages related to email sending
  const [emailStatusMessage, setEmailStatusMessage] = useState('')
  const [emailErrorMessage, setEmailErrorMessage] = useState('')

  // State for generic message modal
  const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' })

  // Function to show the generic message modal
  const showMessage = (title, message) => {
    setMessageModal({ show: true, title, message })
  }

  // Function to hide the generic message modal
  const hideMessage = () => {
    setMessageModal({ show: false, title: '', message: '' })
  }

  // useEffect hook to fetch payslip data when the component mounts or state.payslip_id changes
  useEffect(() => {
    const fetchPayslip = async () => {
      try {
        // Make an Axios GET request to fetch payslip details
        const res = await axios.get(
          `https://piquota.com/payslip-apis/read_payslip.php?payslip_id=${state?.payslip_id}`,
          {
            headers: {
              Authorization: `Bearer ${getToken()}`, // Attach the JWT token for authentication
            },
          },
        )
        // Extract payslip data; assuming it's the first element if the response is an array
        const payslipData = Array.isArray(res.data.payslips) ? res.data.payslips[0] : null
        setPayslip(payslipData)

        // Pre-fill recipient email and subject for the email modal
        if (payslipData) {
          setRecipientEmail(payslipData.employee_email || '')
          setEmailSubject(`Payslip for ${payslipData.month} ${payslipData.year}`)
        }
      } catch (error) {
        // Log and handle errors during payslip fetching
        console.error('Error fetching payslip:', error)
        setPayslip(null) // Clear payslip data on error
        showMessage('Error', 'Failed to fetch payslip details.')
      }
    }

    // Fetch payslip only if payslip_id is available in state
    if (state?.payslip_id) {
      fetchPayslip()
    }
  }, [state]) // Dependency array: re-run effect if state changes

  /**
   * Generates a PDF Blob from the HTML content of the payslip.
   * This function uses html2canvas to convert the HTML to an image,
   * and then jsPDF to create a PDF document from that image.
   * Elements with 'no-print' class are temporarily hidden during capture.
   * @returns {Promise<Blob|null>} A Promise that resolves with the PDF Blob, or null if an error occurs.
   */
  const generatePdfBlob = async () => {
    if (!payslipRef.current) {
      console.error('Payslip content not found for PDF generation.')
      showMessage('PDF Error', 'Payslip content not available for PDF generation.')
      return null
    }

    // Identify and temporarily hide elements that should not appear in the PDF
    const elementsToHide = document.querySelectorAll('.no-print')
    elementsToHide.forEach((el) => (el.style.display = 'none'))

    // Define A4 dimensions in pixels (assuming 96 DPI for web content)
    const A4_WIDTH_PX = 794
    const A4_HEIGHT_PX = 1123 // Standard A4 height at 96 DPI, adjusted slightly for better fit

    // Get a reference to the payslip content element
    const payslipContent = payslipRef.current
    // Store original styles to restore them after screenshot
    const originalWidth = payslipContent.style.width
    const originalPadding = payslipContent.style.padding
    const originalMargin = payslipContent.style.margin

    // Apply temporary styles to ensure the content fits well for canvas capture
    payslipContent.style.width = `${A4_WIDTH_PX}px`
    // Set a minimum height for capture, actual content height will override if larger
    payslipContent.style.height = 'auto' // Let content define height
    payslipContent.style.padding = '0' // Remove padding for capture accuracy
    payslipContent.style.margin = '0 auto' // Center the content for consistent capture

    try {
      // Use html2canvas to render the HTML content to a canvas
      const canvas = await html2canvas(payslipRef.current, {
        scale: 3, // Increase scale for higher resolution in the PDF
        useCORS: true, // Important if your images (like company logo) are hosted externally
        backgroundColor: '#ffffff', // Ensure a white background
        width: A4_WIDTH_PX, // Capture area width
        windowWidth: A4_WIDTH_PX, // Adjust window width for rendering if needed
      })

      // Restore original styles of the payslip content div
      payslipContent.style.width = originalWidth
      payslipContent.style.padding = originalPadding
      payslipContent.style.margin = originalMargin

      // Convert canvas to JPEG data URL for smaller file size in PDF
      const imgData = canvas.toDataURL('image/jpeg', 1.0) // Quality 1.0 (max)

      // Initialize jsPDF document (portrait, millimeters, A4 size)
      const pdf = new jsPDF('p', 'mm', 'a4')

      // Get PDF page dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      // Calculate content dimensions with small margins
      const margin = 10 // 10mm margin on all sides
      const contentWidth = pdfWidth - margin * 2
      // Calculate content height maintaining aspect ratio
      const contentHeight = (canvas.height * contentWidth) / canvas.width

      let position = margin // Initial Y position for adding image, considering top margin
      let heightLeft = contentHeight // Remaining height of the image to be placed

      // Add the first part of the image to the PDF
      pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight)
      heightLeft -= pdfHeight - margin * 2 // Subtract the printable area height from total image height
      position += pdfHeight - margin * 2 // Move position for the next page

      // Loop to add more pages if content overflows A4 height
      while (heightLeft > 0) {
        pdf.addPage() // Add a new page
        // Calculate the Y position for the next part of the image on the new page
        // It's a negative offset from the total content height, plus the top margin for the new page
        const yPos = -position + margin
        pdf.addImage(imgData, 'JPEG', margin, yPos, contentWidth, contentHeight)
        heightLeft -= pdfHeight - margin * 2 // Reduce remaining height
        position += pdfHeight - margin * 2 // Increment position
      }

      // Restore display style for elements that were hidden
      elementsToHide.forEach((el) => (el.style.display = '')) // Revert display style

      return pdf.output('blob') // Return the generated PDF as a Blob
    } catch (error) {
      console.error('Error generating PDF:', error)
      // Restore hidden elements even if PDF generation fails
      elementsToHide.forEach((el) => (el.style.display = ''))
      showMessage('PDF Generation Failed', 'An error occurred while generating the PDF.')
      return null
    }
  }

  /**
   * Handles downloading the payslip PDF.
   * Generates the PDF Blob and triggers a file download.
   */
  const handleDownloadPdf = async () => {
    const pdfBlob = await generatePdfBlob() // Get the PDF Blob
    if (pdfBlob) {
      // Create a dynamic filename based on payslip data
      const fileName = payslip
        ? `payslip_${payslip.employee_id}_${payslip.month}_${payslip.year}.pdf`
        : 'payslip.pdf'

      // Create a URL for the Blob and programmatically trigger a download
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a) // Append to body to ensure it works across browsers
      a.click() // Simulate a click on the link
      document.body.removeChild(a) // Clean up the temporary link
      URL.revokeObjectURL(url) // Release the object URL to free up memory
    }
  }

  const handleSendEmailDirectly = async () => {
    setEmailStatusMessage('')
    setEmailErrorMessage('')
    setIsSendingEmail(true)

    if (!recipientEmail || !emailSubject || !payslip?.employee_name) {
      setEmailErrorMessage('Recipient email, subject, or employee name is missing.')
      setIsSendingEmail(false)
      showMessage('Email Failed', 'Recipient email, subject, or employee name is missing.')
      return
    }

    try {
      // 1. Generate PDF Blob from content
      const pdfBlob = await generatePdfBlob()
      if (!pdfBlob) {
        setEmailErrorMessage('Failed to generate PDF.')
        setIsSendingEmail(false)
        return
      }

      // 2. Create a File object
      const fileName = `payslip_${payslip.employee_id}_${payslip.month}_${payslip.year}.pdf`
      const pdfFile = new File([pdfBlob], fileName, {
        type: 'application/pdf',
        lastModified: Date.now(),
      })

      // 3. Construct FormData as expected by PHP backend
      const formData = new FormData()
      formData.append('pdf_file', pdfFile) // 👈 This must match PHP: $_FILES['pdf_file']
      formData.append('user_email', recipientEmail) // 👈 PHP: $_POST['user_email']
      formData.append('subject', emailSubject)
      formData.append('employee_name', payslip.employee_name)

      // 4. Send with token (DON'T set Content-Type manually!)
      const token = getToken()
      const response = await axios.post(
        'https://piquota.com/payslip-apis/send_payslip_email.php',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`, // ✅ JWT expected by PHP
          },
        },
      )

      setEmailStatusMessage(response.data.message || 'Email sent!')
      showMessage('Email Sent', response.data.message || 'Success')
    } catch (err) {
      console.error('Email send error:', err)
      setEmailErrorMessage(err.response?.data?.error || 'Failed to send email')
      showMessage('Email Failed', err.response?.data?.error || 'Email failed')
    } finally {
      setIsSendingEmail(false)
    }
  }

  // Render a message if no payslip ID is provided in the state
  if (!state?.payslip_id) {
    return (
      <div>
        <AppSidebar />
        <div className="wrapper d-flex flex-column min-vh-100">
          <AppHeader />
          <div className="container mt-4 text-center">
            <p className="text-danger">No payslip selected. Please go back.</p>
            <button className="btn btn-secondary mt-3" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Main component render
  return (
    <div className="bg-white text-dark min-vh-100">
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div className="container mt-4 p-4 shadow border bg-white" style={{ maxWidth: '900px' }}>
          {!payslip ? (
            // Display loading spinner and message if payslip data is not yet loaded
            <div className="text-center">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2">Loading payslip...</p>
            </div>
          ) : (
            // Render payslip content and action buttons once data is loaded
            <>
              {/* Action buttons (Download, Email, Back) - marked as no-print */}
              <div className="text-center mt-3 no-print">
                <button className="btn btn-primary me-2" onClick={handleDownloadPdf}>
                  <FontAwesomeIcon icon={faDownload} className="me-2" /> Download
                </button>
                <button
                  className="btn btn-info text-white me-2"
                  onClick={handleSendEmailDirectly} // Trigger email send directly
                  disabled={isSendingEmail} // Disable button while sending
                >
                  <FontAwesomeIcon icon={faPaperPlane} className="me-2" />{' '}
                  {isSendingEmail ? 'Sending...' : 'Email'}
                </button>
                <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                  Back
                </button>
              </div>

              {/* This div contains the content to be converted to PDF.
                  It is referenced by payslipRef. */}
              <div ref={payslipRef} className="payslip-pdf-content">
                {/* Company Header */}
                <div className="row align-items-center mb-3">
                  <div className="col-4 text-start">
                    <img
                      src={companyLogo}
                      alt="Company Logo"
                      className="img-fluid"
                      style={{ maxWidth: '120px', height: 'auto' }}
                      // Add onerror for placeholder in case logo fails to load
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = 'https://placehold.co/120x60/cccccc/333333?text=Logo'
                      }}
                    />
                  </div>
                  <div className="col-8 text-end">
                    <p className="fw-semibold mb-0" style={{ fontSize: '0.9rem' }}>
                      13, Aarudhra Enclave, Athipalayam Road,
                      <br />
                      Saravanampatti, Coimbatore 641035
                    </p>
                  </div>
                </div>
                <div className="row border border-dark mb-3 mx-0">
                  {/* Common Headings Row */}
                  <div className="bg-secondary col-12 text-center fw-bold border-end border-dark text-white py-2">
                    PAYSLIP : {payslip.month?.toUpperCase()} {payslip.year}
                  </div>

                  {/* Employee Details Left Column */}
                  <div className="col-6 p-0">
                    <table className="table table-sm mb-0">
                      <tbody className="Allowances-table">
                        <tr>
                          <td className="fw-bold ps-2 py-1 text-dark" style={{ width: '40%' }}>
                            EMP ID
                          </td>
                          <td className="fw-bold py-1 text-dark text-end">{payslip.employee_id}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold ps-2 py-1 text-dark">DESIGNATION</td>
                          <td className="fw-bold py-1 text-dark text-end">
                            {payslip.employee_designation}
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold ps-2 py-1 text-dark">PF NUMBER</td>
                          <td className="fw-bold py-1 text-dark text-end">
                            {payslip.employee_pf_number}
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold ps-2 py-1 text-dark">DAYS PRESENT</td>
                          <td className="fw-bold py-1 text-dark text-end">
                            {payslip.days_present}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Allowances Right Column */}
                  <div className="col-6 p-0 border-start Allowances-table">
                    <table className="table table-sm mb-0">
                      <tbody>
                        <tr>
                          <td className="fw-bold ps-2 py-1 text-dark">EMP NAME</td>
                          <td className="fw-bold text-end pe-2 py-1 text-dark">
                            {payslip.employee_name}
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold ps-2 py-1 text-dark">DATE OF JOINING</td>
                          <td className="fw-bold text-end pe-2 py-1 text-dark">
                            {payslip.employee_date_of_joining}
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold ps-2 py-1 text-dark">DAYS IN MONTH</td>
                          <td className="fw-bold ps-2 py-1 text-dark text-end">
                            {payslip.days_in_month}
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold ps-2 py-1 text-dark">TOTAL LEAVES</td>
                          <td className="fw-bold text-end pe-2 py-1 text-dark">
                            {payslip.total_leaves}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <h6 className="bg-secondary text-white text-center py-2 mb-3 rounded">
                  MONTH OF SALARY PAID: {payslip.month?.toUpperCase()} {payslip.year}
                </h6>
                <div className="row border border-dark mb-3 mx-0">
                  {/* Section Headings */}
                  <div className=" bg-secondary col-6 text-center fw-bold border-end border-dark py-2 bg-secondary text-white">
                    EARNINGS
                  </div>
                  <div className=" bg-secondary col-6 text-center fw-bold py-2 bg-secondary text-white">
                    DEDUCTIONS
                  </div>

                  {/* Earnings Column */}
                  <div className="col-6 p-0 bg-success earnings-table">
                    <table className="table table-sm mb-0 bg-white">
                      <tbody className="earnings-table">
                        <tr>
                          <td className="fw-bold ps-2 py-1 text-dark">BASIC</td>
                          <td className="fw-bold pe-2 py-1 text-dark text-end">₹{payslip.basic}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold ps-2 py-1 text-dark">HRA</td>
                          <td className="fw-bold pe-2 py-1 text-dark text-end">₹{payslip.hra}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold ps-2 py-1 text-dark">SPL ALLOW</td>
                          <td className="fw-bold pe-2 py-1 text-dark text-end">
                            ₹{payslip.special_allowance}
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold ps-2 py-1 text-dark">ADHOC</td>
                          <td className="fw-bold pe-2 py-1 text-dark text-end">₹{payslip.adhoc}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold ps-2 py-1 text-dark">FOOD ALLOWANCE</td>
                          <td className="fw-bold pe-2 py-1 text-dark text-end">
                            ₹{payslip.food_allowance}
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold ps-2 py-1 text-dark">COMMUNICATION</td>
                          <td className="fw-bold pe-2 py-1 text-dark text-end">
                            ₹{payslip.communication_allowance}
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold ps-2 py-1 text-dark">INTERNET</td>
                          <td className="fw-bold pe-2 py-1 text-dark text-end">
                            ₹{payslip.internet_allowance}
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold ps-2 py-1 text-dark">-</td>
                          <td className="fw-bold pe-2 py-1 text-dark text-end">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Deductions Column */}
                  <div className="col-6 p-0 border-start ">
                    <table className="table table-sm mb-0 text-white">
                      <tbody className="deductions-table">
                        <tr>
                          <td className="fw-bold ps-2 py-1 text-dark">PF</td>
                          <td className="fw-bold text-end pe-2 py-1 text-dark">
                            ₹{payslip.pf_deduction}
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold ps-2 py-1 text-dark">PT</td>
                          <td className="fw-bold text-end pe-2 py-1 text-dark">
                            ₹{payslip.pt_deduction}
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold ps-2 py-1 text-dark">TDS</td>
                          <td className="fw-bold text-end pe-2 py-1 text-dark">
                            ₹{payslip.tds_deduction}
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold ps-2 py-1 text-dark">INSURANCE DEDUCTION</td>
                          <td className="fw-bold text-end pe-2 py-1 text-dark">
                            ₹{payslip.insurance_deduction}
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold ps-2 py-1 text-dark">LWF</td>
                          <td className="fw-bold text-end pe-2 py-1 text-dark">
                            ₹{payslip.lwf_deduction}
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold ps-2 py-1 text-dark">ESI</td>
                          <td className="fw-bold text-end pe-2 py-1 text-dark">
                            ₹{payslip.esi_deduction}
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold ps-2 py-1 text-dark">VPF</td>
                          <td className="fw-bold text-end pe-2 py-1 text-dark">
                            ₹{payslip.vpf_deduction}
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold ps-2 py-1 text-dark">OTHER RECOVERY</td>
                          <td className="fw-bold text-end pe-2 py-1 text-dark">
                            ₹{payslip.other_recovery}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* New Totals Section - Corrected Layout */}
                <div className="row border border-dark mb-3 mx-0">
                  <div className="col-6 bg-secondary text-white py-2 border-end border-dark">
                    <span className="fw-bold ps-2">Gross Total:</span>
                    <span className="fw-bold float-end pe-2">₹{payslip.gross_salary}</span>
                  </div>
                  <div className="col-6 bg-secondary text-white py-2">
                    <span className="fw-bold ps-2">Total Deduction:</span>
                    <span className="fw-bold float-end pe-2">₹{payslip.total_deduction}</span>
                  </div>

                  <div className="col-12 py-2">
                    <div className="d-flex justify-content-end align-items-center mb-1">
                      <span className="fw-bold me-3">Bonus:</span>
                      <span className="fw-bold">₹{payslip.bonus}</span>
                    </div>
                    <div className="d-flex justify-content-end align-items-center">
                      <span className="fw-bold me-3">Salary Hold:</span>
                      <span className="fw-bold">₹{payslip.salary_hold}</span>
                    </div>
                  </div>

                  {/* Total Payable Line */}
                  <div className="col-12 d-flex justify-content-between py-2 border-top border-dark bg-secondary text-white">
                    <span className="fw-bold ps-2">TOTAL PAYABLE:</span>
                    <span className="fw-bold pe-2">₹{payslip.total_payable}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Generic Message Modal rendered outside the main content flow */}
      <MessageModal
        show={messageModal.show}
        title={messageModal.title}
        message={messageModal.message}
        onClose={hideMessage}
      />
    </div>
  )
}

export default ViewPayslip
