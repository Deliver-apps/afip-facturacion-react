import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import { getFacturas, retryFactura } from "@src/api/facturacion";
import lodash from "lodash";
import CircleIcon from "@mui/icons-material/Circle";
import * as cronParser from "cron-parser";
import ReplayIcon from "@mui/icons-material/Replay";
import { getUsers } from "@src/api/users";
import { showErrorToast, showSuccessToast } from "@src/helpers/toastifyCustom";

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

const CardList: React.FC<Props> = ({ updateCards, setUpdateCards }) => {
  const [groupedJobs, setGroupedJobs] = useState<Record<number, Job[]>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentOpenDialog, setCurrentOpenDialog] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const itemsPerPage = 40;
  const [isRetrying, setIsRetrying] = useState(false);

  const getNextCronDate = (cronExpression: string, createdAt: string) => {
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
  };

  const items = React.useMemo(() => {
    return Object.entries(groupedJobs).map(([key, value]) => {
      const total = value.reduce(
        (acc, curr) => acc + parseFloat(curr.valueToBill),
        0,
      );

      const lastJob = value[value.length - 1];

      const monthLastJob = new Date(lastJob.createdAt).toLocaleDateString(
        "es-AR",
        {
          month: "long",
        },
      );
      const currentMonth = new Date().toLocaleDateString("es-AR", {
        month: "short",
      });
      const formattedTotal = new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
      }).format(total);

      const user = users.find((user) => user.id === Number(key));
      const allFinished = value.every((job) => job.status === "completed");

      const maxDateJob = lodash.maxBy(value, (job) => new Date(job.createdAt));
      console.log(
        lastJob,
        key,
        value,
        getNextCronDate(
          maxDateJob?.cronExpression ?? "",
          maxDateJob?.createdAt ?? "",
        ),
        currentMonth,
      );
      return {
        id: key,
        title: `Fact. ${
          monthLastJob.slice(0, 1).toUpperCase() + monthLastJob.slice(1, 10)
        } (Cuit: ${user?.username})`,
        subtitle: `${user?.real_name}`,
        finished: allFinished,
        content: `${value.length}`,
        total: `${formattedTotal}`,
        active: getNextCronDate(
          maxDateJob?.cronExpression ?? "",
          maxDateJob?.createdAt ?? "",
        )?.includes(currentMonth),
      };
    });
  }, [groupedJobs, users]);

  const formatMoney = (value: string) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(parseFloat(value));
  };

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = items.slice(startIndex, startIndex + itemsPerPage);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleOpenDialog = (key: string) => {
    setCurrentOpenDialog(parseInt(key));
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  useEffect(() => {
    getUsers()
      .then((data) => {
        setUsers(data);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
      });
  }, []);

  useEffect(() => {
    if (updateCards) {
      getFacturas()
        .then((data: Job[]) => {
          const groupedData = lodash.groupBy(data, "userId");
          setGroupedJobs({ ...groupedData }); // Ensure new reference
          setUpdateCards(false); // Reset immediately
        })
        .catch((error) => {
          console.error("Error fetching facturas:", error);
          setUpdateCards(false); // Reset on error
        });
    }
  }, [updateCards]);

  useEffect(() => {
    if (openDialog) {
      setCurrentOpenDialog(currentOpenDialog);
    } else {
      setCurrentOpenDialog(0);
    }
  }, [currentOpenDialog, openDialog]);

  const filterByKey = (key: number) => {
    return groupedJobs[key] || [];
  };

  const selectColor = (status: string) => {
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
  };

  const getDaysDifference = (date1: Date, date2: Date) => {
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
  };

  const retryJob = async (jobId: number, jobUserId: number) => {
    console.log("Retrying job... " + jobId);
    setIsRetrying(true);
    try {
      const job = groupedJobs[jobUserId].find((job) => job.id === jobId);
      const response = await retryFactura(jobId);

      if (response.status === 201) {
        job!.status = "completed";
        setGroupedJobs({ ...groupedJobs });
        showSuccessToast("Job Ejecutado Correctamente", "top-right", 3000);
      } else {
        showErrorToast("Error al reintentar el job", "top-right", 3000);
      }
      setIsRetrying(false);
    } catch (error) {
      console.error("Error fetching facturas:", error);
      setUpdateCards(false); // Reset on error
      setIsRetrying(false);
      showErrorToast("Error al reintentar el job", "top-right", 3000);
    }
  };

  return (
    <div>
      <Stack
        direction="row"
        flexWrap="wrap"
        justifyContent="center"
        gap={2}
        sx={{ width: "100%", mb: 2 }}
      >
        {currentItems.map((item) => (
          <HoverCard
            key={item.id}
            sx={{
              width: "100%",
              maxWidth: 300,
              ":hover": { cursor: "grab", color: "primary.main" },
            }}
            onClick={() => handleOpenDialog(item.id)}
          >
            <CardContent
              sx={{
                backgroundColor: item.active ? "aquamarine" : "grey.300",
              }}
            >
              <Typography variant="subtitle2" component="div">
                {item.title}
              </Typography>
              <Typography variant="subtitle2" component="div">
                {item.subtitle}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Cant. Facturas: <strong>{item.content}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total: <span style={{ color: "red" }}>{item.total}</span>{" "}
                <CircleIcon
                  sx={{
                    color: item.finished ? "success.dark" : "error.dark",
                    fontSize: 14,
                    position: "relative",
                    top: 2,
                  }}
                />
              </Typography>
            </CardContent>
          </HoverCard>
        ))}
      </Stack>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detalles de Facturación</DialogTitle>
        <DialogContent>
          <Stack
            direction="row"
            flexWrap="wrap"
            gap={1}
            justifyContent="center"
          >
            {filterByKey(currentOpenDialog).map((job, index) => (
              <Stack
                key={index}
                sx={{ width: "calc(25% - 16px)", cursor: "context-menu" }}
                mb={2}
                borderBottom={1}
              >
                <Card>
                  <CardContent>
                    <Typography variant="h6">
                      {`Job ID: ${job.id}`}{" "}
                      {(job.status === "failed" ||
                        (job.status === "pending" &&
                          getDaysDifference(
                            new Date(job.createdAt),
                            new Date(),
                          ) > 1)) && (
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
        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            color="primary"
            variant="contained"
          >
            CLOSE
          </Button>
        </DialogActions>
      </Dialog>
      <Stack
        direction="row"
        justifyContent="center"
        spacing={2}
        sx={{
          display: Object.keys(groupedJobs).length > 0 ? "flex" : "none",
        }}
      >
        <Button
          variant="contained"
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
        >
          Anterior
        </Button>
        <Typography variant="body1" position="relative" top={7}>
          Página {currentPage} de {totalPages}
        </Typography>
        <Button
          variant="contained"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
        >
          Próxima
        </Button>
      </Stack>
    </div>
  );
};

export default CardList;
