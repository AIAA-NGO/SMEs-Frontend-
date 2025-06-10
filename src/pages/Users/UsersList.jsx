import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Box,
  Typography,
  Alert,
  AlertTitle,
  IconButton,
  Tooltip,
  Menu,
  MenuItem
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  LockReset as PasswordIcon,
  MoreVert as MoreIcon,
  Refresh as RefreshIcon
} from "@mui/icons-material";

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const navigate = useNavigate();

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
    navigate("/users/create"); // This will redirect to CreateUser component
  };

  if (loading) {
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
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateUser}
            sx={{ mr: 1 }}
          >
            Create User
          </Button>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchUsers}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {users.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: (theme) => theme.palette.grey[100] }}>
                <TableCell>ID</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Full Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email || 'N/A'}</TableCell>
                  <TableCell>{user.fullName || 'N/A'}</TableCell>
                  <TableCell>
                    {user.roles?.map(role => (
                      <Box 
                        key={role} 
                        component="span"
                        sx={{
                          px: 1,
                          py: 0.5,
                          mr: 1,
                          bgcolor: 'primary.light',
                          color: 'primary.contrastText',
                          borderRadius: 1,
                          fontSize: '0.75rem'
                        }}
                      >
                        {role}
                      </Box>
                    ))}
                  </TableCell>
                  <TableCell>
                    <Box
                      component="span"
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: user.active ? 'success.light' : 'error.light',
                        color: user.active ? 'success.contrastText' : 'error.contrastText',
                        fontSize: '0.75rem'
                      }}
                    >
                      {user.active ? 'Active' : 'Inactive'}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      aria-label="more"
                      aria-controls={`user-menu-${user.id}`}
                      aria-haspopup="true"
                      onClick={(e) => handleMenuOpen(e, user.id)}
                    >
                      <MoreIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="textSecondary">
            No users available
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateUser}
            sx={{ mt: 2 }}
          >
            Create First User
          </Button>
        </Box>
      )}

      <Menu
        id="user-actions-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditUser}>
          <EditIcon sx={{ mr: 1 }} /> Edit User
        </MenuItem>
        <MenuItem onClick={handleChangePassword}>
          <PasswordIcon sx={{ mr: 1 }} /> Change Password
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default UsersList;