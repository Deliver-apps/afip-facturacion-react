import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  Stack,
  Typography,
  styled,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Box,
} from "@mui/material";
import { getFacturas, pauseBilling, retryFactura } from "@src/api/facturacion";
import lodash from "lodash";
import CircleIcon from "@mui/icons-material/Circle";
import * as cronParser from "cron-parser";
import ReplayIcon from "@mui/icons-material/Replay";
import { showErrorToast, showSuccessToast } from "@src/helpers/toastifyCustom";
import { useUsers } from "@src/hooks";

const HoverCard = styled(Card)({
  transition: "transform 0.3s ease",
  "&:hover": {
    transform: "scale(1.05)",
  },
});

interface Job {
  id: number;
  salePoint: number;
  status: string;
  userId: number;
  valueToBill: string;
  createdAt: string;
  cronExpression: string;
}

interface User {
  id: number;
  real_name: string;
  username: string;
}

interface Props {
  updateCards: boolean;
  setUpdateCards: React.Dispatch<React.SetStateAction<boolean>>;
}

const CardList: React.FC<Props> = React.memo(({ updateCards, setUpdateCards }) => {
  // Usar el hook personalizado para usuarios
  const { users } = useUsers();
  
  // Estados principales
  const [groupedJobs, setGroupedJobs] = useState<Record<number, Job[]>>({});
  const [oldGroupedJobs, setOldGroupedJobs] = useState<Record<number, Job[]>>({});
  const [labelButton, setLabelButton] = useState<string>("Facturaciones Previas");
  const [tempGroupedJobs, setTempGroupedJobs] = useState<Record<number, Job[]>>({});
  const [showButton, setShowButton] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Estados de diálogos
  const [openDialog, setOpenDialog] = useState(false);
  const [currentOpenDialog, setCurrentOpenDialog] = useState(0);
  const [openConfirmP, setOpenConfirmP] = useState(false);
  
  // Estados de loading
  const [isRetrying, setIsRetrying] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  
  // Constantes
  const itemsPerPage = 40;
  // Memoizar funciones utilitarias
  const formatMoney = useCallback((value: string) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(parseFloat(value));
  }, []);

  const getNextCronDate = useCallback((cronExpression: string, createdAt: string) => {
    try {
      // Parse the cron expression
      const interval = cronParser.parseExpression(cronExpression, {
        tz: "America/Argentina/Buenos_Aires", // Set timezone for Argentina
      });

      // Get the next date based on the cron expression
      const nextDate = interval.next().toDate();
      const getMonthDifference = (dateFrom: Date, dateTo: Date): number => {
        const yearDiff = dateTo.getFullYear() - dateFrom.getFullYear();
        const monthDiff = dateTo.getMonth() - dateFrom.getMonth();

        // Total months difference
        return yearDiff * 12 + monthDiff;
      };

      // Format the date to Argentina timezone using Intl.DateTimeFormat
      const formatter = new Intl.DateTimeFormat("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
        year: "numeric",
        month: "short",
        day: "2-digit",
      });

      return formatter.format(
        nextDate.setMonth(
          nextDate.getMonth() -
            getMonthDifference(new Date(createdAt), nextDate),
        ),
      );
    } catch (error) {
      console.error("Invalid cron expression:", error);
      return null;
    }
  }, []);

  const isBeforeToday = useCallback((date: string) => {
    const formatter = new Intl.DateTimeFormat("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "short",
      day: "2-digit",
    });

    return date < formatter.format(new Date());
  }, []);

  // Memoizar el cálculo de items que es muy pesado
  const items = useMemo(() => {
    if (!groupedJobs || Object.keys(groupedJobs).length === 0) return [];
    
    const currentMonth = new Date().toLocaleDateString("es-AR", {
      month: "short",
    });

    return Object.entries(groupedJobs).map(([key, value]) => {
      const total = value.reduce((acc, curr) => acc + parseFloat(curr.valueToBill), 0);
      const lastJob = value[value.length - 1];
      
      if (!lastJob) return null;

      const monthLastJob = new Date(lastJob.createdAt).toLocaleDateString("es-AR", {
        month: "long",
      });
      
      const user = users.find((user) => user.id === Number(key));
      const allFinished = value.every((job) => job.status === "completed");

      const maxDateJob = lodash.maxBy(value, (job) => new Date(job.createdAt));
      const active = maxDateJob ? 
        getNextCronDate(maxDateJob.cronExpression, maxDateJob.createdAt)?.includes(currentMonth) : 
        false;
        
      const succesJobs = value.filter((job) => job.status === "completed");
      const failedOrPendingJobs = value.filter((job) => job.status !== "completed");
      
      const sumSuccesJobs = succesJobs.reduce((acc, curr) => acc + parseFloat(curr.valueToBill), 0);
      const sumFailedOrPendingJobs = failedOrPendingJobs.reduce((acc, curr) => acc + parseFloat(curr.valueToBill), 0);
      
      return {
        id: key,
        title: `Fact. ${active ? "" : "Hasta"} ${
          monthLastJob.slice(0, 1).toUpperCase() + monthLastJob.slice(1, 10)
        } (Cuit: ${user?.username}) `,
        old: `${active ? "" : "(Incluye facturas meses anteriores)"}`,
        subtitle: `${user?.real_name}`,
        finished: allFinished,
        content: `${value.length}`,
        total: formatMoney(total.toString()),
        active,
        sumSuccesJobs: formatMoney(sumSuccesJobs.toString()),
        sumFailedOrPendingJobs: formatMoney(sumFailedOrPendingJobs.toString()),
      };
    }).filter(Boolean);
  }, [groupedJobs, users, getNextCronDate, formatMoney]);

  // Memoizar cálculos de paginación
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = items.slice(startIndex, startIndex + itemsPerPage);
    
    return { totalPages, currentItems };
  }, [items, currentPage, itemsPerPage]);

  // Memoizar funciones de paginación
  const handlePreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(paginationData.totalPages, prev + 1));
  }, [paginationData.totalPages]);

  const handleOpenDialog = useCallback((key: string) => {
    setCurrentOpenDialog(parseInt(key));
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
  }, []);

  // Los usuarios se cargan desde el hook useUsers, no necesitamos este useEffect

  // Memoizar la función de carga de facturas
  const loadFacturas = useCallback(async (forceRefresh = false) => {
    try {
      const data: Job[] = await getFacturas(forceRefresh);
      const orderByStatus = lodash.orderBy(data, ["status"], ["desc"]);
      const currentMonth = new Date().toLocaleDateString("es-AR", {
        month: "short",
      });
      
      // Filtrar trabajos actuales y antiguos de manera más eficiente
      const currentJobs: Job[] = [];
      const oldJobs: Job[] = [];
      
      orderByStatus.forEach((job) => {
        const nextDate = getNextCronDate(job.cronExpression, job.createdAt);
        const isCurrentMonth = nextDate?.includes(currentMonth);
        
        if (isCurrentMonth || job.status === "failed" || job.status === "pending") {
          currentJobs.push(job);
        } else if (job.status === "completed") {
          oldJobs.push(job);
        }
      });
      
      const groupedData = lodash.groupBy(currentJobs, "userId");
      const groupedDataOld = lodash.groupBy(oldJobs, "userId");
      
      setGroupedJobs(groupedData);
      setOldGroupedJobs(groupedDataOld);
      setShowButton(true);
    } catch (error) {
      console.error("Error fetching facturas:", error);
    } finally {
      setUpdateCards(false);
    }
  }, [getNextCronDate, setUpdateCards]);

  useEffect(() => {
    if (updateCards) {
      loadFacturas();
    }
  }, [updateCards, loadFacturas]);

  useEffect(() => {
    if (openDialog) {
      setCurrentOpenDialog(currentOpenDialog);
    } else {
      setCurrentOpenDialog(0);
    }
  }, [currentOpenDialog, openDialog]);

  const filterByKey = useCallback((key: number) => {
    return groupedJobs[key] || [];
  }, [groupedJobs]);

  const selectColor = useCallback((status: string) => {
    switch (status) {
      case "pending":
        return "warning.main";
      case "completed":
        return "success.main";
      case "error":
        return "error.main";
      default:
        return "error.main";
    }
  }, []);

  // const getDaysDifference = (date1: Date, date2: Date) => {
  //   const oneDay = 1000 * 60 * 60 * 24;
  //   return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
  // };

  const retryJob = useCallback(async (jobId: number, jobUserId: number) => {
    console.log("Retrying job... " + jobId);
    setIsRetrying(true);
    
    try {
      const response = await retryFactura(jobId);

      if (response.status === 201) {
        // Actualizar el estado del job de manera inmutable
        setGroupedJobs(prevJobs => ({
          ...prevJobs,
          [jobUserId]: prevJobs[jobUserId].map(job => 
            job.id === jobId ? { ...job, status: "completed" } : job
          )
        }));
        showSuccessToast("Job Ejecutado Correctamente", "top-right", 3000);
      } else {
        showErrorToast("Error al reintentar el job", "top-right", 3000);
      }
    } catch (error) {
      console.error("Error retrying job:", error);
      showErrorToast("Error al reintentar el job", "top-right", 3000);
    } finally {
      setIsRetrying(false);
    }
  }, []);

  const showOldCards = useCallback(() => {
    if (labelButton === "Facturaciones Actuales") {
      setLabelButton("Facturaciones Previas");
      setTempGroupedJobs(groupedJobs);
      setGroupedJobs(tempGroupedJobs);
    } else {
      setLabelButton("Facturaciones Actuales");
      setTempGroupedJobs(groupedJobs);
      setGroupedJobs(oldGroupedJobs);
    }
  }, [labelButton, groupedJobs, tempGroupedJobs, oldGroupedJobs]);

  const handlePauseBilling = useCallback(async () => {
    console.log("Pausing billing...");
    setIsPausing(true);
    
    try {
      const jobsFromUser = filterByKey(currentOpenDialog).map((job) => job.id);
      const response = await pauseBilling(jobsFromUser);
      
      if (response.message === "Jobs Paused successfully") {
        showSuccessToast("Facturación pausada correctamente", "top-right", 3000);
        
        // Actualizar jobs de manera inmutable
        setGroupedJobs(prev => ({
          ...prev,
          [currentOpenDialog]: prev[currentOpenDialog].map(job => ({
            ...job,
            status: job.status === "completed" ? "completed" : "failed",
          }))
        }));
      } else {
        showErrorToast("Error al pausar la facturación", "top-right", 3000);
      }
    } catch (error) {
      console.error("Error pausing billing:", error);
      showErrorToast("Error al pausar la facturación", "top-right", 3000);
    } finally {
      setIsPausing(false);
    }
  }, [currentOpenDialog, filterByKey]);

  return (
    <div>
      <Button
        variant="contained"
        sx={{
          display: showButton ? "flex" : "none",
          margin: "0 auto",
          width: { xs: "90%", sm: "70%", md: "50%" },
          mb: 2,
          borderRadius: 2,
          py: 1.5,
          background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          fontWeight: 600,
          '&:hover': {
            background: 'linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          }
        }}
        onClick={() => showOldCards()}
      >
        {labelButton}
      </Button>
      <Stack
        direction="row"
        flexWrap="wrap"
        justifyContent="center"
        gap={{ xs: 1, sm: 2 }}
        sx={{ 
          width: "100%", 
          mb: 2,
          '@media (max-width:600px)': {
            gap: 1,
          }
        }}
      >
        {paginationData.currentItems.map((item) => (
          <HoverCard
            key={item.id}
            sx={{
              width: { xs: "100%", sm: "calc(50% - 8px)", md: "calc(33% - 12px)", lg: 300 },
              maxWidth: { xs: "100%", sm: 300 },
              minHeight: 200, // Altura mínima fija
              ":hover": { cursor: "grab", color: "primary.main" },
              '@media (max-width:600px)': {
                width: "100%",
                maxWidth: "100%",
              }
            }}
            onClick={() => handleOpenDialog(item.id)}
          >
            <CardContent
              sx={{
                backgroundColor: item.active ? "rgba(16, 185, 129, 0.1)" : "rgba(156, 163, 175, 0.1)",
                p: { xs: 2, sm: 3 },
                border: item.active ? '2px solid #10b981' : '2px solid transparent',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                height: '100%', // Ocupar toda la altura
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between', // Distribuir contenido uniformemente
                '&:hover': {
                  backgroundColor: item.active ? "rgba(16, 185, 129, 0.15)" : "rgba(156, 163, 175, 0.15)",
                  transform: 'translateY(-2px)',
                }
              }}
            >
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography
                  variant="subtitle1"
                  component="div"
                  fontWeight={"bold"}
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    lineHeight: 1.2,
                    minHeight: '2.4em', // Altura mínima para el título
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {item.title}
                </Typography>
                <Typography
                  variant="subtitle1"
                  component="div"
                  color="success"
                  fontWeight={"bold"}
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    minHeight: '1.2em',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {item.old}
                </Typography>
                <Typography
                  variant="subtitle1"
                  component="div"
                  fontWeight={"bold"}
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    minHeight: '1.2em',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {item.subtitle}
                </Typography>
                <Typography 
                  variant="body1" 
                  color="black" 
                  fontWeight="bold" 
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    minHeight: '1.2em',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  Cant. Facturas: <strong>{item.content}</strong>
                </Typography>
              </Box>

              <Box sx={{ mt: 'auto', pt: 1 }}>
                <Typography 
                  variant="subtitle1" 
                  color="success" 
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    minHeight: '1.2em',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <strong>{`Facturado: ${item.sumSuccesJobs}`}</strong>
                </Typography>
                <Typography 
                  variant="subtitle1" 
                  color="error" 
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    minHeight: '1.2em',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <strong>
                    {`Resta Facturar: ${item.sumFailedOrPendingJobs}`}{" "}
                  </strong>
                </Typography>
                <Typography 
                  variant="subtitle1" 
                  color="black" 
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    minHeight: '1.2em',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <strong>
                    Total a Facturar:{" "}
                    <span style={{ color: "black" }}>{item.total}</span>{" "}
                    <CircleIcon
                      sx={{
                        color: item.finished ? "success.dark" : "error.dark",
                        fontSize: 14,
                        position: "relative",
                        top: 2,
                      }}
                    />
                  </strong>
                </Typography>
              </Box>
            </CardContent>
          </HoverCard>
        ))}
      </Stack>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: 3,
            '@media (max-width:600px)': {
              margin: 2,
              width: 'calc(100% - 32px)',
            }
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: 'info.main', 
          color: 'white',
          borderRadius: '12px 12px 0 0'
        }}>
          Detalles de Facturación
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack
            direction="row"
            flexWrap="wrap"
            gap={1}
            justifyContent="center"
            sx={{
              '@media (max-width:600px)': {
                gap: 0.5,
              }
            }}
          >
            {filterByKey(currentOpenDialog).map((job, index) => (
              <Stack
                key={index}
                sx={{ 
                  width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(25% - 12px)' }, 
                  cursor: "context-menu" 
                }}
                mb={2}
                borderBottom={1}
              >
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      {`Job ID: ${job.id}`}{" "}
                      {(job.status === "failed" ||
                        (job.status === "pending" &&
                          isBeforeToday(
                            getNextCronDate(job.cronExpression, job.createdAt)!,
                          ))) && (
                        <ReplayIcon
                          sx={{
                            color: isRetrying ? "grey.500" : "error.dark",
                            position: "relative",
                            top: 4.5,
                            cursor: "pointer",
                            ":hover": { color: "error.dark" },
                            pointerEvents: isRetrying ? "none" : "auto",
                          }}
                          onClick={() => {
                            retryJob(job.id, job.userId);
                          }}
                        />
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {`Id de Usuario: ${job.userId}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {`Total: ${formatMoney(job.valueToBill)}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {`Estado: ${job.status}`}{" "}
                      <CircleIcon
                        sx={{
                          color: selectColor(job.status),
                          fontSize: 14,
                          position: "relative",
                          top: 2,
                        }}
                      />
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {`Ejecución: ${getNextCronDate(job.cronExpression, job.createdAt)}`}
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => setOpenConfirmP(true)}
            color="primary"
            variant="contained"
            disabled={isPausing}
            sx={{ mr: 1, minWidth: 120 }}
          >
            {isPausing ? (
              <CircularProgress size="2rem" color="primary" />
            ) : (
              "Pausar Facturación"
            )}
          </Button>
          <Button
            onClick={handleCloseDialog}
            color="primary"
            variant="outlined"
            sx={{ minWidth: 120 }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog 
        open={openConfirmP} 
        onClose={() => setOpenConfirmP(false)}
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: 3,
            '@media (max-width:600px)': {
              margin: 2,
              width: 'calc(100% - 32px)',
            }
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: 'warning.main', 
          color: 'white',
          borderRadius: '12px 12px 0 0'
        }}>
          Confirmar pausa
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1">
            ¿Seguro que deseas pausar la facturación?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => {
              setOpenConfirmP(false);
              handlePauseBilling();
            }}
            color="primary"
            variant="contained"
            disabled={isPausing}
            sx={{ minWidth: 120 }}
          >
            Confirmar
          </Button>
          <Button 
            onClick={() => setOpenConfirmP(false)}
            variant="outlined"
            sx={{ minWidth: 120 }}
          >
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
      <Stack
        direction="row"
        justifyContent="center"
        spacing={2}
        sx={{
          display: Object.keys(groupedJobs).length > 0 ? "flex" : "none",
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          gap: { xs: 1, sm: 2 },
          mt: 2
        }}
      >
        <Button
          variant="contained"
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          sx={{ 
            minWidth: { xs: 'auto', sm: 120 },
            fontSize: { xs: '0.875rem', sm: '1rem' },
            py: 1,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4b5563 0%, #374151 100%)',
            },
            '&:disabled': {
              background: 'grey.300',
              color: 'grey.500',
            }
          }}
        >
          ⬅️ Anterior
        </Button>
        <Typography 
          variant="body1" 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            fontSize: { xs: '0.875rem', sm: '1rem' },
            fontWeight: 600,
            color: 'primary.main'
          }}
        >
          📄 Página {currentPage} de {paginationData.totalPages}
        </Typography>
        <Button
          variant="contained"
          onClick={handleNextPage}
          disabled={currentPage === paginationData.totalPages}
          sx={{ 
            minWidth: { xs: 'auto', sm: 120 },
            fontSize: { xs: '0.875rem', sm: '1rem' },
            py: 1,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4b5563 0%, #374151 100%)',
            },
            '&:disabled': {
              background: 'grey.300',
              color: 'grey.500',
            }
          }}
        >
          Próxima ➡️
        </Button>
      </Stack>
    </div>
  );
});

CardList.displayName = 'CardList';

export default CardList;
