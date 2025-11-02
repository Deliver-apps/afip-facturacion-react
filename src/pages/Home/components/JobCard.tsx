import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import CircleIcon from '@mui/icons-material/Circle';

const HoverCard = styled(Card)({
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  willChange: "transform",
  backfaceVisibility: "hidden",
  transform: "translateZ(0)",
  "&:hover": {
    transform: "scale3d(1.05, 1.05, 1) translateZ(0)",
    boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
  },
});

interface JobCardProps {
  item: {
    id: string;
    title: string;
    old: string;
    subtitle: string;
    finished: boolean;
    content: string;
    total: string;
    active: boolean;
    sumSuccesJobs: string;
    sumFailedOrPendingJobs: string;
  };
  onOpenDialog: (id: string) => void;
}

const JobCard: React.FC<JobCardProps> = React.memo(({ item, onOpenDialog }) => {
  return (
    <HoverCard
      sx={{
        width: { xs: "100%", sm: "calc(50% - 8px)", md: "calc(33% - 12px)", lg: 300 },
        maxWidth: { xs: "100%", sm: 300 },
        minHeight: 200,
        ":hover": { cursor: "grab", color: "primary.main" },
        '@media (max-width:600px)': {
          width: "100%",
          maxWidth: "100%",
        }
      }}
      onClick={() => onOpenDialog(item.id)}
    >
      <CardContent
        sx={{
          backgroundColor: item.active ? "rgba(16, 185, 129, 0.1)" : "rgba(156, 163, 175, 0.1)",
          p: { xs: 2, sm: 3 },
          border: item.active ? '2px solid #10b981' : '2px solid transparent',
          borderRadius: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
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
              minHeight: '2.4em',
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
              {`Resta Facturar: ${item.sumFailedOrPendingJobs}`}
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
  );
});

JobCard.displayName = 'JobCard';

export default JobCard;
