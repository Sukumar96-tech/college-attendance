export default function Home() {
  return (
    <main className="home">
      <div className="container">
        <div className="badge">COLLEGE ATTENDANCE SYSTEM</div>

        <h1>
          College Attendance
          <br />
          Management System
        </h1>

        <p className="description">
          A simple and secure attendance management platform for HODs and
          students. Manage daily attendance and view attendance records
          anytime.
        </p>

        <div className="actions">
          <a href="/login" className="primaryButton">
            Login
          </a>

          <a href="/register" className="secondaryButton">
            Student Registration
          </a>
        </div>

        <div className="features">
          <div className="feature">
            <h3>HOD Management</h3>
            <p>
              Manage students, working days, holidays, attendance and reports.
            </p>
          </div>

          <div className="feature">
            <h3>Student Portal</h3>
            <p>
              Students can view their attendance percentage and attendance
              history anytime.
            </p>
          </div>

          <div className="feature">
            <h3>Accurate Attendance</h3>
            <p>
              Holidays and incomplete attendance days are excluded from
              attendance calculations.
            </p>
          </div>
        </div>

        <footer>
          <p>College Attendance Management System</p>
        </footer>
      </div>
    </main>
  );
}