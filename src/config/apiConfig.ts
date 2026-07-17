export const APIconfig = "http://localhost/cqi/api";

export const API_ENDPOINTS = {
    // AUTHENTICATION, SESSION, AND REGISTRATION ENDPOINTS
    LOGIN: `${APIconfig}/login.php`,
    REGISTER: `${APIconfig}/register.php`,
    CASCADING_OPTIONS: `${APIconfig}/helpers/get_cascading_options.php`,

    // ADMINISTRATIVE ENDPOINTS
    ADMIN_USERS: `${APIconfig}/admin/users.php`,
    ADMIN_COURSES: `${APIconfig}/admin/courses.php`,
    ADMIN_DEPARTMENTS: `${APIconfig}/admin/departments.php`,
    ADMIN_PROGRAMS: `${APIconfig}/admin/programs.php`,
    ADMIN_ATTAINMENT: `${APIconfig}/admin/attainment.php`,
    ADMIN_SCHEDULES: `${APIconfig}/admin/schedules.php`,
    ADMIN_ACTIVE_TERM: `${APIconfig}/admin/active_term.php`,
    ADMIN_CREATE_COURSE: `${APIconfig}/admin/create_course.php`,
    ADMIN_UPDATE_COURSE: `${APIconfig}/admin/update_course.php`,
    ADMIN_CREATE_DEPARTMENT: `${APIconfig}/admin/create_department.php`,
    ADMIN_UPDATE_DEPARTMENT: `${APIconfig}/admin/update_department.php`,
    ADMIN_CREATE_PROGRAM: `${APIconfig}/admin/create_program.php`,
    ADMIN_UPDATE_PROGRAM: `${APIconfig}/admin/update_program.php`,
    ADMIN_CREATE_SCHEDULE: `${APIconfig}/admin/create_schedule.php`,
    ADMIN_UPDATE_SCHEDULE: `${APIconfig}/admin/update_schedule.php`,
    ADMIN_APPROVE_USER: `${APIconfig}/admin/approve_user.php`,
    ADMIN_UPDATE_USER: `${APIconfig}/admin/update_user.php`,

    // FACULTY ENDPOINTS
    FACULTY_PERIOD_SUMMARY: `${APIconfig}/faculty/period_summary.php`,
    FACULTY_CLASS_DETAILS: `${APIconfig}/faculty/class_details.php`,
    FACULTY_ILO_ANALYSIS: `${APIconfig}/faculty/ilo_analysis.php`,
    FACULTY_OVERALL_SUMMARY: `${APIconfig}/faculty/overall_summary.php`,
    FACULTY_MY_SCHEDULES: `${APIconfig}/faculty/my_schedules.php`,
    FACULTY_MANAGE_ROSTER: `${APIconfig}/faculty/manage_roster.php`,
    FACULTY_GET_SIGNATORIES: `${APIconfig}/faculty/get_signatories.php`,
    FACULTY_DELETE_STUDENT: `${APIconfig}/faculty/delete_student.php`,
    FACULTY_TEST_ANALYSIS: `${APIconfig}/faculty/test_analysis.php`,

    // CHAIRPERSON ENDPOINTS
    CHAIRPERSON_MONITOR: `${APIconfig}/chairperson/fetch_program_schedules.php`,

    // DEPARTMENT CHAIR ENDPOINTS
    DEPARTMENT_CHAIR_MONITOR: `${APIconfig}/department_chair/fetch_schedules.php`,
    
}