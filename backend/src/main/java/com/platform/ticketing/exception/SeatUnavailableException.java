package com.platform.ticketing.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.Collections;
import java.util.List;

@Getter
@ResponseStatus(HttpStatus.CONFLICT)
public class SeatUnavailableException extends RuntimeException {
    private final List<Long> conflictingSeatIds;

    public SeatUnavailableException(String message, List<Long> conflictingSeatIds) {
        super(message);
        this.conflictingSeatIds = conflictingSeatIds != null ? conflictingSeatIds : Collections.emptyList();
    }

    public SeatUnavailableException(String message, Long conflictingSeatId) {
        this(message, Collections.singletonList(conflictingSeatId));
    }
}
