import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Alert,
  AlertTitle,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
  useTheme,
  Tooltip
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  LockReset as PasswordIcon,
  MoreVert as MoreIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterAlt as FilterIcon,
  Clear as ClearIcon
} from "@mui/icons-material";
import { CSVLink } from "react-csv";
import * as XLSX from "xlsx";
import { useReactToPrint } from "react-to-print";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const navigate = useNavigate();
  const componentRef = useRef();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.down('md'));

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const api = axios.create({
        baseURL: process.env.REACT_APP_API_URL || "http://localhost:8080",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      });

      const response = await api.get("/api/users");
      
      let usersData = [];
      if (Array.isArray(response.data)) {
        usersData = response.data;
      } else if (Array.isArray(response.data?.users)) {
        usersData = response.data.users;
      } else if (Array.isArray(response.data?.data)) {
        usersData = response.data.data;
      }

      setUsers(usersData);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      
      if (error.response) {
        if (error.response.status === 500) {
          setError("Server error. Please try again later.");
        } else if (error.response.status === 401) {
          setError("Session expired. Please login again.");
        } else {
          setError(error.response.data?.message || "Failed to load users");
        }
      } else if (error.request) {
        setError("Network error. Please check your connection.");
      } else {
        setError(error.message || "Failed to load users");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleMenuOpen = (event, userId) => {
    setAnchorEl(event.currentTarget);
    setSelectedUserId(userId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUserId(null);
  };

  const handleEditUser = () => {
    navigate(`/users/edit/${selectedUserId}`);
    handleMenuClose();
  };

  const handleChangePassword = () => {
    navigate(`/users/change-password/${selectedUserId}`);
    handleMenuClose();
  };

  const handleCreateUser = () => {
    navigate("/users/create");
  };

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    pageStyle: `
      @page { size: auto; margin: 10mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        button, form, .no-print { display: none !important; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        th { background-color: #f2f2f2; }
      }
    `,
    documentTitle: 'Users Report'
  });

  const handleExcelDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredUsers.map(user => ({
      ID: user.id,
      Username: user.username,
      Email: user.email || 'N/A',
      'Full Name': user.fullName || 'N/A',
      Role: user.roles?.join(', ') || 'N/A',
      Status: user.active ? 'Active' : 'Inactive',
      'Created At': formatCreatedAt(user.createdAt || user.created_at)
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, "users.xlsx");
  };

  const formatCreatedAt = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid Date';
    }
  };

  const clearDateFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!startDate && !endDate) return matchesSearch;
    
    const createdAt = user.createdAt || user.created_at;
    if (!createdAt) return matchesSearch;
    
    try {
      const userDate = new Date(createdAt);
      if (isNaN(userDate.getTime())) return matchesSearch;
      
      const start = startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : null;
      const end = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : null;
      
      if (start && end) {
        return matchesSearch && userDate >= start && userDate <= end;
      } else if (start) {
        return matchesSearch && userDate >= start;
      } else if (end) {
        return matchesSearch && userDate <= end;
      }
    } catch (e) {
      console.error('Error filtering by date:', e);
      return matchesSearch;
    }
    
    return matchesSearch;
  });

  if (loading && users.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box my={2}>
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
        <Box mt={2}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={fetchUsers}
          >
            Retry
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, md: 3 },
      bgcolor: 'background.paper',
      borderRadius: 2,
      boxShadow: 1,
      width: '100%',
      overflow: 'hidden'
    }}>
      <div className="no-print">
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: 2, 
          mb: 4 
        }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
            User Management
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1, 
            justifyContent: { xs: 'center', md: 'flex-end' } 
          }}>
            <Button 
              onClick={handlePrint}
              variant="outlined"
              size="small"
            >
              Print
            </Button>
            <CSVLink 
              data={filteredUsers.map(user => ({
                ID: user.id,
                Username: user.username,
                Email: user.email || 'N/A',
                'Full Name': user.fullName || 'N/A',
                Role: user.roles?.join(', ') || 'N/A',
                Status: user.active ? 'Active' : 'Inactive',
                'Created At': formatCreatedAt(user.createdAt || user.created_at)
              }))} 
              filename={"users.csv"}
              style={{ textDecoration: 'none' }}
            >
              <Button variant="outlined" size="small">
                Download CSV
              </Button>
            </CSVLink>
            <Button 
              onClick={handleExcelDownload}
              variant="outlined"
              size="small"
            >
              Download Excel
            </Button>
          </Box>
        </Box>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
          gap: 2, 
          mb: 4 
        }}>
          <Box>
            <TextField
              fullWidth
              size="small"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
              }}
            />
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            alignItems: 'center', 
            gap: 1 
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              width: '100%' 
            }}>
              <DatePicker
                selected={startDate}
                onChange={date => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                placeholderText="Start Date"
                customInput={
                  <TextField
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: <FilterIcon sx={{ color: 'action.active', mr: 1 }} />,
                    }}
                  />
                }
              />
              <Typography variant="body2" color="text.secondary">to</Typography>
              <DatePicker
                selected={endDate}
                onChange={date => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                placeholderText="End Date"
                customInput={<TextField fullWidth size="small" />}
              />
            </Box>
            {(startDate || endDate) && (
              <Button 
                onClick={clearDateFilters}
                size="small"
                startIcon={<ClearIcon />}
              >
                Clear
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateUser}
            size="small"
          >
            Create User
          </Button>
        </Box>

        {error && (
          <Box mb={2}>
            <Alert severity="error">
              <AlertTitle>Error</AlertTitle>
              {error}
            </Alert>
          </Box>
        )}
      </div>

      <Box sx={{ display: 'none', print: 'block', mb: 2 }}>
        <Typography variant="h5" component="h1" textAlign="center" gutterBottom>
          Users Report
        </Typography>
        {(startDate || endDate) && (
          <Typography variant="body2" textAlign="center">
            {startDate && `From: ${startDate.toLocaleDateString()}`}
            {startDate && endDate && ' to '}
            {endDate && `To: ${endDate.toLocaleDateString()}`}
          </Typography>
        )}
        <Typography variant="body2" textAlign="center">
          Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </Typography>
      </Box>

      <Box sx={{ 
        width: '100%',
        overflowX: 'auto',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
      }}>
        <Box ref={componentRef} sx={{ width: '100%' }}>
          <TableContainer>
            <Table sx={{ 
              minWidth: isSmallScreen ? 300 : 600,
              '& .MuiTableCell-root': {
                py: 1,
                px: 1.5,
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                maxWidth: isSmallScreen ? '120px' : '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }
            }}>
              <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                  <TableCell sx={{ width: '60px' }}>ID</TableCell>
                  <TableCell>Username</TableCell>
                  {!isSmallScreen && <TableCell>Email</TableCell>}
                  {!isMediumScreen && <TableCell>Full Name</TableCell>}
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right" className="no-print" sx={{ width: '60px' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Loading users...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm || startDate || endDate 
                          ? 'No users match your search criteria' 
                          : 'No users found'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      {!isSmallScreen && (
                        <TableCell>{user.email || 'N/A'}</TableCell>
                      )}
                      {!isMediumScreen && (
                        <TableCell>{user.fullName || 'N/A'}</TableCell>
                      )}
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {user.roles?.slice(0, 2).map(role => (
                            <Box 
                              key={role} 
                              component="span"
                              sx={{
                                px: 1,
                                py: 0.25,
                                bgcolor: 'primary.light',
                                color: 'primary.contrastText',
                                borderRadius: 1,
                                fontSize: '0.7rem',
                                lineHeight: 1.5
                              }}
                            >
                              {role}
                            </Box>
                          ))}
                          {user.roles?.length > 2 && (
                            <Tooltip title={user.roles.slice(2).join(', ')}>
                              <Box 
                                component="span"
                                sx={{
                                  px: 1,
                                  py: 0.25,
                                  bgcolor: 'primary.light',
                                  color: 'primary.contrastText',
                                  borderRadius: 1,
                                  fontSize: '0.7rem'
                                }}
                              >
                                +{user.roles.length - 2}
                              </Box>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box
                          component="span"
                          sx={{
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            bgcolor: user.active ? 'success.light' : 'error.light',
                            color: user.active ? 'success.contrastText' : 'error.contrastText',
                            fontSize: '0.75rem',
                            display: 'inline-block'
                          }}
                        >
                          {user.active ? 'Active' : 'Inactive'}
                        </Box>
                      </TableCell>
                      <TableCell align="right" className="no-print">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, user.id)}
                        >
                          <MoreIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditUser} dense>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={handleChangePassword} dense>
          <PasswordIcon fontSize="small" sx={{ mr: 1 }} /> Change Password
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default UsersList;