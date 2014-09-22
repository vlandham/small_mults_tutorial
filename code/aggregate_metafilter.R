require('ggplot2')
require("dplyr")
require("lubridate")
require("stringr")

#http://mefiwiki.com/wiki/Infodump
#http://stuff.metafilter.com/infodump/

askmefi <- read.table("~/Downloads/postdata_askme.txt", header = TRUE, sep = "\t", skip = 1, fill = TRUE)

#askmefi$date <-  mdy_hms(askmefi$datestamp)

#splits <- strsplit(as.character(askmefi$datestamp), split= " ")

#mon_year <- apply(data.frame(askmefi$datestamp), 1, function(r) {x <- strsplit(as.character(r), split= " "); return(paste(x[1], x[2], sep="-"))})

# some of the datestamps had a doulbe space in them...
clean_stamps <- gsub("  ", " ", askmefi$datestamp)
dates <- str_split_fixed(clean_stamps, " ", 4)
dates_df <- data.frame(dates)
head(dates_df)
colnames(dates_df) <- c("month",  "day", "year", "time")
dates_df$mon_year <- paste(dates_df$month, dates_df$year, sep = "-")

askmefi_dates <- cbind(askmefi, dates_df)
askmefi_months <- summarise(group_by(askmefi_dates, mon_year, category), n = n())

write.table(askmefi_months, file = "", row.names = FALSE, col.names = TRUE, sep = "\t")


p <- ggplot(askmefi, aes(x = category)) + geom_histogram(binwidth = 1)
p


by_cat <- group_by(askmefi, category)
summ <- summarise(by_cat, n = n())
summ
